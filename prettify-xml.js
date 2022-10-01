#!/usr/bin/env node

import { parseXmlDocument } from 'slimdom';
import chalk from 'chalk';

// Promise the input piped into this program
async function getStreamedInputData() {
	if (process.stdin.isTTY) {
		throw new Error('Process STDIN is not TTY');
	}
	let data = '';
	process.stdin.on('readable', () => {
		const chunk = process.stdin.read();
		if (chunk !== null) {
			data += chunk;
		}
	});
	return new Promise((resolve) => process.stdin.on('end', () => resolve(data)));
}

const colors = {
	attributeNamespacePrefix: chalk.green,
	attributeNodeName: chalk.green,
	attributeSyntax: chalk.green,
	attributeValue: chalk.greenBright,
	cdataData: chalk.magenta,
	cdataSyntax: chalk.magenta,
	commentData: chalk.grey,
	commentSyntax: chalk.grey,
	elementNamespacePrefix: chalk.red,
	elementNodeName: chalk.red,
	elementSyntax: chalk.red,
	processingInstructionData: chalk.blueBright,
	processingInstructionName: chalk.blue,
	processingInstructionSyntax: chalk.blue,
	textData: chalk.white,
	textSyntax: chalk.grey,
};

function attributeToString(node) {
	const namespacePrefix = node.prefix;
	return [
		namespacePrefix && colors.attributeNamespacePrefix(namespacePrefix),
		namespacePrefix && colors.attributeSyntax(':'),
		colors.attributeNodeName(node.localName),
		colors.attributeSyntax('="'),
		colors.attributeValue(node.nodeValue),
		colors.attributeSyntax('"'),
	].join('');
}

function textToString(node) {
	return colors.textSyntax(`"`) + colors.textData(node.nodeValue) + colors.textSyntax(`"`);
}

function elementToLines(node) {
	const isSelfClosing = node.childNodes.length === 0;
	const namespacePrefix = node.prefix;

	const nodeName = [
		namespacePrefix && colors.elementNamespacePrefix(namespacePrefix),
		namespacePrefix && colors.elementSyntax(':'),
		colors.elementNodeName(node.localName),
	].join('');

	const opening = [
		colors.elementSyntax('<'),
		nodeName,
		...Array.from(node.attributes)
			.map(attributeToString)
			.map((line) => ` ${line}`),
		(isSelfClosing && colors.elementSyntax(' /')) || '',
		colors.elementSyntax('>'),
	].join('');

	if (isSelfClosing) {
		return [opening];
	}

	return [
		opening,
		...Array.from(node.childNodes)
			.reduce((flat, child) => [...flat, ...childToLines(child)], [])
			.map((line) => `  ${line}`),
		colors.elementSyntax('</') + nodeName + colors.elementSyntax('>'),
	];
}

function commentToString(node) {
	return (
		colors.commentSyntax(`<!--`) + colors.commentData(node.nodeValue) + colors.commentSyntax(`-->`)
	);
}

function cdataToString(node) {
	return (
		colors.cdataSyntax(`<![CDATA[`) + colors.cdataData(node.nodeValue) + colors.cdataSyntax(`]]>`)
	);
}

function processingInstructionToString(node) {
	return [
		colors.processingInstructionSyntax(`<?`),
		colors.processingInstructionName(node.nodeName),
		node.nodeValue && colors.processingInstructionData(` ${node.nodeValue}`),
		colors.processingInstructionSyntax(`?>`),
	].join('');
}

function childToLines(node) {
	switch (node.nodeType) {
		case 1: // Element
			return elementToLines(node);
		case 2: // Attribute
			return [attributeToString(node)];
		case 3: // Text node
			return [textToString(node)];
		case 4: // CDATA
			return [cdataToString(node)];
		case 7: // Processing instruction
			return [processingInstructionToString(node)];
		case 8: // Comment
			return [commentToString(node)];
		case 9: // Comment
			return Array.from(node.childNodes).reduce(
				(flat, child) => [...flat, ...childToLines(child)],
				[],
			);
		case 10: // Document type node
		case 11: // Fragment
		default:
			throw new Error(
				`Unsupported node type "${node.nodeType}", please submit an issue  @ https://github.com/wvbe/prettify-xml/issues/new`,
			);
	}
}

(async () => {
	const lines = await getStreamedInputData();
	let dom;
	try {
		dom = parseXmlDocument(lines);
	} catch (error) {
		throw new Error(`Your input XML could not be parsed: ${error.message}`);
	}
	console.log(childToLines(dom).join('\n'));
})().catch((error) => console.error(error.stack || error));
