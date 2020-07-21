const fs = require('fs-extra');
const path = require('path');
const beautify = require('js-beautify').js;
const unified = require('unified');
const markdown = require('remark-parse');
const glob = require('glob');

const prefix = 'hips';
const exclusiveList = ["toast", "notify", "dialog", 'locale','validate'];

const run = () => {
  const allMd = glob.sync('./hips-vue-ui/packages/**/zh-CN.md');
  const reg = new RegExp("./hips-vue-ui/packages/(.*)/zh-CN.md");
  const tagList = allMd.map(v => reg.exec(v)[1]); // 全部的内容 不要做容错处理 当出现问题的时候可以进行 查找
  const resultJson = {};
  allMd.forEach((mdPath, index) => {

    if (exclusiveList.includes(tagList[index])) {
      return;
    }

    const data = fs.readFileSync(mdPath, {
      encoding: 'utf-8'
    });
    const tree = unified().use(markdown).parse(data);
    const tagName = `${prefix}-${tagList[index]}`;
    resultJson[tagName] = {
      description: tagName,
      attributes: {}
    };

    for (let item of tree.children) {

      if (item.type === "table") {
        // 只处理一个table
        // 获取到对应的内容 默认值跟可选值可能有变化
        let defaultGap = null;
        let optionsGap = null;
        let descIndex = 1; // 默认第二个是说明
        let optinTypeIndex = 2;//默认第二个是类型
        const trLength = item.children[0].children.length;
        item.children[0].children.forEach((tr, trIndex) => {
          // 如果有默认值
          const value = tr.children[0] && tr.children[0].value;
          if (value) {
            if (value === '默认值') {
              defaultGap = item.children[0].children.length - trIndex;
            }
            if (value === '可选值') {
              optionsGap = item.children[0].children.length - trIndex;
            }
            if (value === '说明') {
              descIndex = trIndex;
            }
            if (value === '类型') {
              optinTypeIndex = trIndex;
            }
          }
        });

        for (let i = 1; i < item.children.length; i++) {
          const tableRow = item.children[i];
          let attrName = '';
          const attributes = resultJson[tagName].attributes;

          tableRow.children.forEach((tableCell, tableCellIndex) => {
            // 此时是属性名称
            if (!tableCell.children[0]) {
              return;
            }
            if (tableCellIndex === 0) {
              attrName = tableCell.children[0].value;
              attributes[attrName] = {};
            }
            // 此时是属性描述
            if (tableCellIndex === descIndex) {
              const description = tableCell.children.map(v => v.value).join('');
              attributes[attrName].description = description;
              // 根据 描述获取到可选值
              if (optionsGap === null && tableCell.children.length > 1) {
                const options = tableCell.children
                  .filter(v => v.type === 'inlineCode')
                  .map(v => v.value);
                if (options.length) {
                  attributes[attrName].options = options;
                }
              }
              if (tableCell.children.length === 1 && description.includes("可选值为")) {
                // 兼容 o1/o2/o3 形式
                const optionString = /可选值为\s?(.*)/.exec(description)[1];
                if (optionString) {
                  const options = optionString.split('/');
                  attributes[attrName].options = options;
                }
              }
            }
            if (optionsGap && tableCellIndex === (tableRow.children.length - optionsGap)) {
              const options = tableCell.children
                .map(v => v.value.split('/'))
                .flat();
              ;
              if (options.length && options[0] !== '-') {
                attributes[attrName].options = options;
              }
            }
            // 此时是属性类型
            if (tableCellIndex === optinTypeIndex) {
              // 注意多值处理
              const multiple = tableRow.children.length - trLength;
              if (multiple) {
                const optionTypeList = [];
                // debugger;
                for (let j = 0; j <= multiple; j++) {
                  optionTypeList.push(
                    tableRow.children[tableCellIndex + j].children[0].value.toLocaleLowerCase().replace('`', '')
                  );
                }
                attributes[attrName].optionType = optionTypeList.join('|');

              } else {
                attributes[attrName].optionType = tableCell.children[0].value.toLocaleLowerCase();
              }
            }
            // 此时是属性的默认值
            if (defaultGap && tableCellIndex === (tableRow.children.length - defaultGap)) {
              const defaultValue = tableCell.children.map(v => v.value).join('');
              attributes[attrName].defaultValue = defaultValue;
            }
          });
        }
        break;
      }
    }
  });
  // 生成文件
  fs.writeJSONSync('../src/docs/ui-tags.json', resultJson, {
    spaces: '\t'
  });
};

run();