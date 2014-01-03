'use strict';

function quoteStringAsRegExp(string) {
 return string.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
}

module.exports = {
  quoteStringAsRegExp: quoteStringAsRegExp
};
