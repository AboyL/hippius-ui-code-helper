const glob = require('glob');

const prefix = 'hips';
const exclusiveList = ["toast", "notify", "dialog", 'locale', 'validate'];
const allMd = glob.sync('./hips-vue-ui/packages/**/zh-CN.md');
const reg = new RegExp("./hips-vue-ui/packages/(.*)/zh-CN.md");
const tagList = allMd.map(v => reg.exec(v)[1]); // 全部的内容 不要做容错处理 当出现问题的时候可以进行 查找

const compatibilityList = {
  'col': ['row'],
  'tab-bar': ['tab-bar-item'],
  'tabs': ['tab'],
  'cell': ['group'],
  'collapse': ['collapse-item'],
  'timeline': ['timeline-item'],
  'radio': ['radio-group'],
  'checkbox': ['checkbox-group'],
  'swipeout': ['swipeout-button'],
  'slide': ['slide-item'],
  'sticky': ['sticky-ele'],
  'fab': ['fab-item']
};

module.exports = {
  prefix,
  exclusiveList,
  allMd,
  tagList,
  compatibilityList
};