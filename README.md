# count-unique-lines

This is a command-line utility that prettifies the XML coming in from your streamed input.

It is meant to make minified XML easier to read, for those of us who handle XML in a terminal
some times.

## Installation

To install Node package, run from anywhere:

```sh
npm i -g wvbe/prettify-xml
```

## Usage

Pipe your lines into this sucker like:

```sh
cat minified.xml | prettify-xml
```
```sh
curl http://rss.cnn.com/rss/edition.rss | prettify-xml
```
```sh
unzip -p my-word-file.docx word/document.xml | prettify-xml
```


## Roadmap

- [ ] Embellishing text data with quotes is optional
- [ ] Respect `@xml:space`, optionally