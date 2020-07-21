import * as vscode from 'vscode';
import { HippiusCompletionItemProvider } from './completion';
import registerWebview from './site/openSite';
import registerHover from './hover-provider';

export function activate(context: vscode.ExtensionContext) {

	let completionItemProvider = new HippiusCompletionItemProvider();
	let completion = vscode.languages.registerCompletionItemProvider([{
		language: 'vue', scheme: 'file'
	}, {
		language: 'html', scheme: 'file'
	}], completionItemProvider, '', ' ', ':', '<', '"', "'", '/', '@', '(');
	context.subscriptions.push(completion);
	
	registerWebview(context);
	registerHover(context);


}

export function deactivate() { }
