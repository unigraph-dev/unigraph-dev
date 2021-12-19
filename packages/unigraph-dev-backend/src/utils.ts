import _ from "lodash";

export function mergeWithConcatArray(objValue: any, srcValue: any) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
}