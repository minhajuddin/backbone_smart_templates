_.smartTemplateSettings = {
  escape: /<%-([\s\S]+?)%>/g,
  evaluate: /<%([\s\S]+?)%>/g,
  interpolate: /<%=([\s\S]+?)%>/g,
  smartInterpolate: /<%:([\s\S]+?)%>/g
};
_.mixin({
  smartInterpolator: function(obj, key, _) {
    key = key.trim();
    if (_.isFunction(obj[key])) return obj[key]();
    if ((_.isUndefined(obj[key]) || _.isNull(obj[key]))) {
      if (_.isFunction(obj['get'])) {
        return obj['get'].call(obj, key);
      }
      return "<b>UNDEF|NULL</b>";
    }

    return obj[key];
  },
  smartTemplate: function(text, data, settings) {
    var settings = _.defaults(settings || {},
    _.smartTemplateSettings),
    escapes = {
      '\\': '\\',
      "'": "'",
      'r': '\r',
      'n': '\n',
      't': '\t',
      'u2028': '\u2028',
      'u2029': '\u2029'
    },
    escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g,
    noMatch = /.^/;
    var variableName = (settings.variable || 'obj');
    for (var p in escapes) escapes[escapes[p]] = p;

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text.replace(escaper, function(match) {
      return '\\' + escapes[match];
    }).replace(settings.escape || noMatch, function(match, code) {
      return "'+\n_.escape(" + unescape(code) + ")+\n'";
    }).replace(settings.interpolate || noMatch, function(match, code) {
      return "'+\n(" + unescape(code) + ")+\n'";
    }).replace(settings.smartInterpolate || noMatch, function(match, code) {

      return "'+\n_.smartInterpolator(" + variableName + ", '" + unescape(code) + "', _)+\n'";

    }).replace(settings.evaluate || noMatch, function(match, code) {
      return "';\n" + unescape(code) + "\n;__p+='";
    }) + "';\n";

    console.log(source);

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" + "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" + source + "return __p;\n";

    var render = new Function(variableName, '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + variableName + '){\n' + source + '}';

    return template;
  }
});

