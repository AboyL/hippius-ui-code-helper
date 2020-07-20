// const list = require('./ui-tags.json');
import * as list from './ui-tags.json';

export interface TagAttr {
  description: string;
  optionType?: string;
  type?:string;
  defaultValue: string;
  options?: string[];
}

export interface TagDocs {
  description: string;
  defaults?: string[];
  attributes: {
    [_props: string]: TagAttr
  };
}

const TagList: {
  [_props: string]: TagDocs
} = list;

export default TagList;
