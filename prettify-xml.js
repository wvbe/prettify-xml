#!/usr/bin/env node

const slimdom = require('slimdom');

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

const INDENT = '  ';

function toLines(node, prefix = '\n') {
	if (node.nodeType === /* Node.ATTRIBUTE_NODE */ 2) {
		return `${node.nodeName}="${node.value}"`;
	}
	if (node.nodeType === /* Node.TEXT_NODE */ 3) {
		return `${prefix}"${node.nodeValue}"`;
	}
	const indent = node.nodeType === /* Node.DOCUMENT_NODE */ 9 ? '' : INDENT;
	const children = Array.from(node.childNodes || [])
		.map((child) => toLines(child, prefix + indent))
		.join('');
	if (node.nodeType === /* Node.ELEMENT_NODE */ 1) {
		const attrs = Array.from(node.attributes)
			.map(toLines)
			.map((str) => ` ${str}`)
			.join(' ');
		return `${prefix}<${node.nodeName + attrs}>${children}${prefix}</${node.nodeName}>`;
	}
	console.error(`Unmapped node of type ${node.nodeType}`);
	return children;
}

(async () => {
	const lines = await getStreamedInputData();
	let dom;
	try {
		dom = slimdom.parseXmlDocument(lines);
	} catch (error) {
		throw new Error(`Your input XML could not be parsed: ${error.message}`);
	}
	const pretty = toLines(dom).trim();
	console.log(pretty);
})().catch((error) => console.error(error.stack || error));
