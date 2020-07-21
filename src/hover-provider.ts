import * as vscode from 'vscode';
import hoverDoc from './docs/hoverDoc';

const getCompoentApi = async (comp: string) => {
  try {
    if (comp in hoverDoc) {
      // @ts-ignore
      const newMarkdown = hoverDoc[comp].hoverDoc;
      return newMarkdown;
    }
    return null;
  } catch (error) {
    return null;
  }
};


/**
 * 组件文档悬浮提示提示 显示api部分的内容
 * @param {*} document 
 * @param {*} position 
 */
async function provideHover(document: vscode.TextDocument, position: vscode.Position) {
  const word = document.getText(document.getWordRangeAtPosition(position));
  const api = await getCompoentApi(word);
  if (api) {
    return new vscode.Hover(`${api}`);
  }

  return null;
}

const registerHover = function (context: vscode.ExtensionContext) {
  // 注册鼠标悬停提示
  context.subscriptions.push(vscode.languages.registerHoverProvider([
    'vue',
    'vue-html',
    'html',
  ], {
    provideHover
  }));
};

export default registerHover;