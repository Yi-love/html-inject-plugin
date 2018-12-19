const path = require('path');
const fs = require('fs');

const childCompiler = require('./lib/compiler');

class HtmlInjectPlugin {
    constructor(options) {
        this.options = options || {};//filename,template,chunks,encode,crossorigin 
    }

    apply(compiler) {
        const self = this;
        let compilationPromise;
        this.options.template = this.getFullTemplatePath(this.options.template, compiler.context);
        //主要创建实时编译模版文件
        compiler.hooks.make.tapAsync('HtmlInjectPlugin' , (compilation, callback) => {
            compilationPromise = childCompiler.createTemplate(self.options.template, compiler.context, self.options.filename, compilation)
                .catch(err => {
                    compilation.errors.push(err.toString());
                    return {
                        content: self.options.showErrors ? err.toString() : 'ERROR',
                        outputName: self.options.filename
                    };
                })
                .then(compilationResult => {
                    callback();
                    return compilationResult.content;
                });
        });
        //触发编译
        compiler.hooks.emit.tapAsync('HtmlInjectPlugin', (compilation, callback) => {
            const chunkOnlyConfig = {
                assets: false,
                cached: false,
                children: false,
                chunks: true,
                chunkModules: false,
                chunkOrigins: false,
                errorDetails: false,
                hash: false,
                modules: false,
                reasons: false,
                source: false,
                timings: false,
                version: false
            };

            const chunks = compilation.getStats().toJson(chunkOnlyConfig).chunks;

            const assets = {
                hash: compilation.hash,
                publicPath: compilation.outputOptions.publicPath || '',
                entry:{}
            };
            //获取资源文件
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkName = chunk.names[0];
                
                assets.entry[chunkName] = {entry:chunk.entry};

                let chunkFiles = [].concat(chunk.files);
                
                const js = chunkFiles.find(chunkFile => /.js($|\?)/.test(chunkFile));
                if ( js ) {
                    assets.entry[chunkName].js = js;
                    assets.entry[chunkName].hash = chunk.hash;
                }
                //depend css
                assets.entry[chunkName].css = chunkFiles.filter(chunkFile => /.css($|\?)/.test(chunkFile));
                //depend
                assets.entry[chunkName].siblings = chunk.siblings;
            }

            let html = fs.readFileSync(self.options.template , self.options.encode || 'utf-8') || '';
            let injectRegx = /<!--\s*inject:(css|js)(:[a-z0-9A-Z._-]+)?\s*-->/img;

            //注入js,css
            html = html.replace(injectRegx , function(source , ext , name , index) {
                if ( name ){
                    name =  name.replace(/^:/,'');
                }
                switch(ext){
                    case 'js':
                        return self.getFullscript(assets , name) + source;
                    case 'css':
                        return self.getFullCss(assets , name) + source;
                    default:
                        break;
                }
            });
            //生成文件
            compilation.assets[self.options.filename || 'index.html'] = {
                source() {
                    return html;
                },
                size() {
                    return html.length;
                }
            };

            callback();
        });
    }
    //生成script
    getFullscript(assets , name){
        let scriptHtml = [];
        let chunks = this.options.chunks || [];
        let crossorigin = this.options.crossorigin ? ('crossorigin=" '+ this.options.crossorigin + '"') : '';
        for ( let i = 0 ; i < chunks.length ; i++ ){
            if ( name && assets.entry !== name ){
                continue;
            }
            scriptHtml.push('<script ' + crossorigin + ' src="' + assets.publicPath + assets.entry[chunks[i]].js + '"></script>');
        }
        return scriptHtml.join('');
    }
    //生成css
    getFullCss(assets , name){
        let cssHtml = [];
        let chunks = this.options.chunks || [];
        for ( let i = 0 ; i < chunks.length ; i++ ){
            if ( name && assets.entry !== name ){
                continue;
            }
            let arr = assets.entry[chunks[i]].css;
            for ( let j = 0 ; j < arr.length; j ++ ){
                if ( arr[j] ){
                    cssHtml.push('<link rel="stylesheet" href="' + assets.publicPath + arr[j] + '"/>');   
                }
                 
            }
        }
        return cssHtml.join('');
    }
    //获取template文件
    getFullTemplatePath (template) {
    // Resolve template path
    return template.replace(
        /([!])([^/\\][^!?]+|[^/\\!?])($|\?[^!?\n]+$)/,
        (match, prefix, filepath, postfix) => prefix + path.resolve(filepath) + postfix);
    }
}

module.exports = HtmlInjectPlugin;