import * as vscode from 'vscode';
import * as components from '../docs/ui-tags.json';
import htmlTemplate from './utils';
const url = `http://hippius-ui.hips.hand-china.com/#/zh-CN/`;

const openSite = (comp: string) => {
  const panel = vscode.window.createWebviewPanel(
    'component-view', // viewType
    "hippius-ui", // 视图标题
    vscode.ViewColumn.Beside, // 显示在编辑器的哪个部位
    {
      enableScripts: true, // 启用JS，默认禁用
      retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
    }
  );

  comp = comp.replace('hips-', '');

  let iframeSrc = `${url}${comp}`;
  if (!comp.includes('dataset')) {
    iframeSrc += `#API`;
  }

  panel.webview.html = htmlTemplate(iframeSrc);
};

// 注册一个文档 web view
// 获取当前的text
const dispose = (uri: vscode.Uri) => {

  if (Object.keys(components).length === 0) {
    return;
  }

  if (uri) {
    const textEditor = vscode.window.activeTextEditor;
    const document = textEditor?.document;
    const selection = textEditor?.selection;
    if (!document || !selection) {
      return;
    }
    
    const word: string =
      document.getText(
        document.getWordRangeAtPosition(selection.start)
      );
    if (typeof word === 'string') {
      if (word in components) {
        openSite(word);
        return;
      }
    }
  }
  vscode.window.showQuickPick(Object.keys(components)).then(selected => {
    selected && openSite(selected);
  });
};

const registerWebview = function (context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('hippius.search', dispose),
  );
};

export default registerWebview;