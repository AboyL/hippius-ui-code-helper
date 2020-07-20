'use strict';

import {
  window, commands, ViewColumn, Disposable, TextDocumentContentProvider, Location,
  Event, Uri, CancellationToken, workspace, CompletionItemProvider, ProviderResult,
  TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind,
  SnippetString, Range, EventEmitter, CompletionContext
} from 'vscode';


import TAGS, { TagAttr } from './docs/ui-tags';

const prettyHTML = require('pretty');

export interface TagObject {
  text: string;
  offset: number;
}


export class HippiusCompletionItemProvider implements CompletionItemProvider {
  private _document!: TextDocument;
  private _position!: Position;
  private tagReg: RegExp = /<([\w-]+)\s+/g; // < <a- <- <--
  private attrReg: RegExp = /(?:\(|\s*)(\w+)=['"][^'"]*/;
  private quotes!: string;

  /**
   * 获取到当前行光标前的所有内容
   * @param position 
   */
  getTextBeforePosition(position: Position): string {
    var start = new Position(position.line, 0);
    var range = new Range(start, position);
    return this._document.getText(range);
  }

  /**
   * 对tag进行匹配 需要注意一行里面有多个tag
   * @param reg 
   * @param txt 
   * @param line 
   */
  matchTag(reg: RegExp, txt: string, line: number): TagObject | undefined {
    let match: RegExpExecArray | null;
    let arr: TagObject[] = [];
    // 在什么情况下不需要进行tag的判断
    if (
      /<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) ||
      (
        this._position.line === line &&
        (
          /^\s*[^<]+\s*>[^<\/>]*$/.test(txt) ||
          /[^<>]*<$/.test(txt[txt.length - 1])
        )
      )
    ) {
      return;
    }
    while ((match = reg.exec(txt))) {
      arr.push({
        text: match[1],
        offset: this._document.offsetAt(new Position(line, match.index))
      });
    }
    return arr.pop();
  }

  getPreTag(): TagObject | undefined {
    let line = this._position.line; // 当前行
    let tag: TagObject | undefined;
    let txt = this.getTextBeforePosition(this._position);
    // 回溯10行
    const MaxLine = 10;

    while (this._position.line - line < MaxLine && line >= 0) {
      if (line !== this._position.line) {
        txt = this._document.lineAt(line).text;
      }
      tag = this.matchTag(this.tagReg, txt, line);
      if (tag === undefined) { return; }
      if (tag) { return <TagObject>tag; }
      line--;
    }
    return;
  }

  getTagAttrs(tag: string) {
    return (TAGS[tag] && TAGS[tag].attributes) || {};
  }


  isAttrStart(tag: TagObject | undefined) {
    return tag;
  }

  getAttrItem(tag: string, attr: string | undefined): TagAttr | undefined {
    if (TAGS[tag]) {
      const tagAttr = TAGS[tag].attributes;
      if (tagAttr && attr) {
        return tagAttr[attr];
      }
    }
    return undefined;
  }

  firstCharsEqual(str1: string, str2: string) {
    if (str2 && str1) {
      return str1[0].toLowerCase() === str2[0].toLowerCase();
    }
    return false;
  }

  /**
   * @description 生成 attr
   * @param param0 
   * @param attrItem 
   */
  buildAttrSuggestion(
    { attr, tag, bind, method }: { attr: string, tag: string, bind: boolean, method: boolean },
    attrItem: TagAttr): CompletionItem | undefined {
    const { description, type, optionType, defaultValue, options } = attrItem;
    if ((method && type === "method") || (bind && type !== "method") || (!method && !bind)) {
      let documentation = description;
      optionType && (documentation += "\n" + `type: ${optionType}`);
      defaultValue && (documentation += "\n" + `default: ${defaultValue}`);
      let sinnpit = new SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`);
      if (options && options.length > 0) {
        sinnpit = new SnippetString(`${attr}=${this.quotes}\${1|${options.join(',')}|}${this.quotes}$0`);
      }

      return {
        label: attr,
        insertText: sinnpit,
        kind: (type && (type === 'method')) ? CompletionItemKind.Method : CompletionItemKind.Property,
        detail: 'hippius-ui',
        documentation,
      };
    } else {
      return undefined;
    }
  }

  getAttrSuggestion(tag: string): CompletionItem[] {
    let suggestions: CompletionItem[] = [];
    let tagAttrs = this.getTagAttrs(tag);
    let preText = this.getTextBeforePosition(this._position);

    // 获取到最后空格后的词汇
    let prefix = preText.replace(/['"]([^'"]*)['"]$/, '').split(/\s|\(+/).pop() || '';
    const method = prefix[0] === '@';
    const bind = prefix[0] === ':';

    // 去掉 :@ 
    prefix = prefix.replace(/[:@]/, '');

    if (/[^@:a-zA-z\s]/.test(prefix[0])) {
      return suggestions;
    }

    for (let attr in tagAttrs) {
      const attrItem: TagAttr | undefined = this.getAttrItem(tag, attr);
      if (attrItem && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
        const sug = this.buildAttrSuggestion({ attr, tag, bind, method }, attrItem);
        sug && suggestions.push(sug);
      }
    }
    return suggestions;
  }

  getPreAttr(): string | undefined {
    let txt = this.getTextBeforePosition(this._position).replace(/"[^'"]*(\s*)[^'"]*$/, '');
    let end = this._position.character;
    let start = txt.lastIndexOf(' ', end) + 1;
    let parsedTxt = this._document.getText(new Range(this._position.line, start, this._position.line, end));

    return this.matchAttr(this.attrReg, parsedTxt);
  }

  matchAttr(reg: RegExp, txt: string): string | undefined {
    let match = reg.exec(txt);
    const result = !/"[^"]*"/.test(txt) && match && match[1];
    if (result) {
      return result;
    }
    return undefined;
  }

  isAttrValueStart(tag: Object | string | undefined, attr: string | undefined) {
    return tag && attr;
  }

  getAttrValueSuggestion(tag: string, attr: string | undefined): CompletionItem[] {
    let suggestions: CompletionItem[] = [];
    const values = this.getAttrValues(tag, attr);
    values.forEach(value => {
      suggestions.push({
        label: value,
        kind: CompletionItemKind.Value
      });
    });
    return suggestions;
  }

  getAttrValues(tag: string, attr: string | undefined) {
    let attrItem = this.getAttrItem(tag, attr);
    let options = attrItem && attrItem.options;
    if (!options && attrItem) {
      if (attrItem.type === 'boolean') {
        options = ['true', 'false'];
      }
    }
    return options || [];
  }

  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;

    const config = workspace.getConfiguration('hippius-ui-code-helper');

    const normalQuotes = config.get('quotes') === 'double' ? '"' : "'";
    this.quotes = normalQuotes;

    let tag: TagObject | string | undefined = this.getPreTag(); // 前面tag
    let attr = this.getPreAttr();
    if (tag && this.isAttrValueStart(tag, attr)) {
      return this.getAttrValueSuggestion(tag.text, attr);
    } else if (this.isAttrStart(tag)) {
      return this.getAttrSuggestion(tag!.text);
    } else {
      return [];
    }
  }
}