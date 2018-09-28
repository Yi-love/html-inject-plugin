const path = require('path');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

//构建模版文件
module.exports.createTemplate = function createTemplate (template, context, outputFilename, compilation) {
    const outputOptions = {
        filename: outputFilename,
        publicPath: compilation.outputOptions.publicPath
    };
    const assetsBeforeCompilation = Object.assign({}, compilation.assets[outputOptions.filename]);
    const compilerName = getCompilerName(context, outputFilename);
    const childCompiler = compilation.createChildCompiler(compilerName, outputOptions);
    childCompiler.context = context;

    //入口文件编译
    new SingleEntryPlugin(this.context, template, undefined).apply(childCompiler);

    //编译(compilation)创建之后钩子
    childCompiler.hooks.compilation.tap('HtmlInjectPlugin' , compilation => {
        if (compilation.cache) {
            if (!compilation.cache[compilerName]) {
                compilation.cache[compilerName] = {};
            }
            compilation.cache = compilation.cache[compilerName];
        }
    });
    //返回pomise
    return new Promise((resolve, reject) => {
        childCompiler.runAsChild((err, entries, childCompilation) => {
            if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
                const errorDetails = childCompilation.errors.map(error => error.message + (error.error ? ':\n' + error.error : '')).join('\n');
                return reject(new Error('Child compilation failed:\n' + errorDetails));
            } else if (err) {
                return reject(err);
            } else {
                //这里需要优化
                const outputName = outputFilename;

                compilation.assets[outputName] = assetsBeforeCompilation[outputName];
                if (assetsBeforeCompilation[outputName] === undefined) {
                    delete compilation.assets[outputName];
                }
                return resolve({
                    hash: entries[0].hash,
                    outputName: outputName,
                    content: childCompilation.assets[outputName].source()
                });
            }
        });
    });
};

//提示
function getCompilerName (context, filename) {
    const absolutePath = path.resolve(context, filename);
    const relativePath = path.relative(context, absolutePath);
    return 'html-inject-plugin for "' + (absolutePath.length < relativePath.length ? absolutePath : relativePath) + '"';
}
