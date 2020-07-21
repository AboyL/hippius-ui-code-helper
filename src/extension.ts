import * as vscode from 'vscode';
import { HippiusCompletionItemProvider } from './completion';
import registerCompletionItemProviderWebview from './site/openSite';

export function activate(context: vscode.ExtensionContext) {

	let completionItemProvider = new HippiusCompletionItemProvider();
	let completion = vscode.languages.registerCompletionItemProvider([{
		language: 'vue', scheme: 'file'
	}, {
		language: 'html', scheme: 'file'
	}], completionItemProvider, '', ' ', ':', '<', '"', "'", '/', '@', '(');
	
	registerCompletionItemProviderWebview(context);
	context.subscriptions.push(completion);

}

export function deactivate() { }
