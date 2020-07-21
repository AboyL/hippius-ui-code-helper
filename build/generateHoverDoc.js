
const fs = require('fs-extra');
const markdown = require('remark-parse');
const getMarkdown = require('remark-stringify');
const unified = require('unified');
const _ = require('lodash');
const {
  prefix,
  exclusiveList,
  allMd,
  tagList
} = require('./generateTagsDoc');

const run = async () => {

  const fileData = {};

  allMd.forEach((mdPath, index) => {
    if (exclusiveList.includes(tagList[index])) {
      return;
    }

    const data = fs.readFileSync(mdPath, {
      encoding: 'utf-8'
    });
    const tree = unified().use(markdown).parse(data);
    const tagName = `${prefix}-${tagList[index]}`;

    try {
      let newTree = {};
      // @ts-ignore
      for (let i = 0; i < tree.children.length; i++) {
        const item = tree.children[i];
        if (item.type === 'table') {
          newTree = item;
          break;
        }
      }
      if (newTree.type) {
        // @ts-ignore
        const newMarkdown = unified().use(getMarkdown).stringify(newTree);
        fileData[tagName] = {
          hoverDoc: newMarkdown
        };
      }
    } catch (error) {
      console.error(item.label);
    }

  });


  fs.writeJSONSync('../src/docs/hoverDoc.json', fileData, {
    spaces: '\t'
  });

};

run();

module.exports = {};