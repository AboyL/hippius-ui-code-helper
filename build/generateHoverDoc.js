
const fs = require('fs-extra');
const markdown = require('remark-parse');
const getMarkdown = require('remark-stringify');
const unified = require('unified');
const _ = require('lodash');
const {
  prefix,
  exclusiveList,
  allMd,
  tagList,
  compatibilityList
} = require('./helper');

const run = async () => {
  const fileData = {};

  allMd.forEach((mdPath, index) => {
    const tagFileName = tagList[index];

    if (exclusiveList.includes(tagFileName)) {
      return;
    }

    const data = fs.readFileSync(mdPath, {
      encoding: 'utf-8'
    });
    const tree = unified().use(markdown).parse(data);
    const tagName = `${prefix}-${tagList[index]}`;

    try {
      let newTree = {};
      let compatibilityTree = {};
      // @ts-ignore
      for (let i = 0; i < tree.children.length; i++) {
        const item = tree.children[i];
        if (item.type === 'table') {
          // 进行兼容处理 例如 col跟row col应该使用第二个而不是使用第一个 此外还要生成hippius-row的悬浮提示 以及相关的内容
          // 通过一般判断跟 index 判断两种机制 可能只需要 title 判断
          const compatibility = compatibilityList[tagFileName];
          if (!compatibility) {
            newTree = item;
            break;
          } else {
            // 根据title进行判断
            if (_.isArray(compatibility)) {
              const titleItem = tree.children[i - 1];
              if (titleItem.type === 'heading') {
                const header = titleItem.children.map(v => v.value).join('').toLocaleLowerCase();
                const title = _.kebabCase(titleItem.children.map(v => v.value).join('').split(' ')[0]);
                if (header.includes('event') || header.includes('slot')) {
                  continue;
                } else if (title === tagFileName || compatibility.indexOf(title) !== -1) {
                  compatibilityTree[`${prefix}-${title}`] = item;
                }
              }
            }
          }
        }
      }
      if (Object.keys(compatibilityTree).length) {
        for (let ctreeKey in compatibilityTree) {
          const newMarkdown = unified().use(getMarkdown).stringify(
            compatibilityTree[ctreeKey]
          );
          fileData[ctreeKey] = {
            hoverDoc: newMarkdown
          };
        }
      } else if (newTree.type) {
        // @ts-ignore
        const newMarkdown = unified().use(getMarkdown).stringify(newTree);
        fileData[tagName] = {
          hoverDoc: newMarkdown
        };
      }
    } catch (error) {
      console.error(error);
    }

  });


  fs.writeJSONSync('../src/docs/hoverDoc.json', fileData, {
    spaces: '\t'
  });

};

run();

module.exports = {};