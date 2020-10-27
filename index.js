const path = require('path');
const fs = require('fs');

const childCompiler = require('./lib/compiler');
const { hrtime } = require('process');

class HtmlInjectPlugin {
    constructor(options) {
        this.options = options || {};//filename,template,chunks,encode,jsOptions,cssOptions
    }

    apply(compiler) {
        const self = this;
        this.options.template = this.getFullTemplatePath(this.options.template, compiler.context);
        //主要创建实时编译模版文件
        compiler.hooks.make.tapAsync('HtmlInjectPlugin' , (compilation, callback) => {
            childCompiler.createTemplate(self.options.template, compiler.context, self.options.filename, compilation)
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
            // 获取预加载文件
            let injectPreloadAllRegx = /<!--\s*inject:preload\s*-->/img;
            let injectPreloadRegx = /<!--\s*inject:preload:(css|js)(:[a-z0-9A-Z._-]+)?\s*-->/img;
            let injectRegx = /<!--\s*inject:(css|js)(:[a-z0-9A-Z._-]+)?\s*-->/img;
            
            // 注入Preload All
            html = html.replace(injectPreloadAllRegx , function(source) {
                return self.getFullScript(assets , false, true) + self.getFullCss(assets , false, true) + source;
            });
            // 注入Preload
            html = html.replace(injectPreloadRegx , function(source , ext , name , index) {
                if ( name ){
                    name =  name.replace(/^:/,'');
                }
                switch(ext){
                    case 'js':
                        return self.getFullScript(assets , name, true) + source;
                    case 'css':
                        return self.getFullCss(assets , name, true) + source;
                    default:
                        return self.getFullScript(assets , name, true) + self.getFullCss(assets , name, true) + source;
                }
            });

            //注入js,css
            html = html.replace(injectRegx , function(source , ext , name , index) {
                if ( name ){
                    name =  name.replace(/^:/,'');
                }
                switch(ext){
                    case 'js':
                        return self.getFullScript(assets , name, false) + source;
                    case 'css':
                        return self.getFullCss(assets , name, false) + source;
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
    getFullScript(assets , name = false, isPreload = false){
        let scriptHtml = [];
        let chunks = this.options.chunks || [];
        let jsOptions = this.options.jsOptions || [];
        let preList = [];

        for ( let i = 0 ; i < chunks.length ; i++ ){
            let chunkName = chunks[i];
            if (name && chunkName !== name){
                continue;
            }
            let attrs = [].concat(Array.isArray(jsOptions) ? jsOptions : typeof jsOptions === 'object' && Array.isArray(jsOptions[chunkName]) ? jsOptions[chunkName] : []);
            let index = attrs.length ? attrs.findIndex((e)=>e.trim() === 'rel="preload"') : -1;
            if (!assets.entry[chunkName] || !assets.entry[chunkName].js){
                continue;
            }
            if (isPreload){
                if (index >= 0 && !preList.includes(assets.publicPath + assets.entry[chunkName].js)){
                    scriptHtml.push('<link ' + ['rel="preload"', 'as="script"'].join(' ') + ' href="' + assets.publicPath + assets.entry[chunkName].js + '"></link>');
                }
            }else {
                if (index >= 0){
                    attrs.splice(index, 1);
                }
                scriptHtml.push('<script ' + attrs.join(' ') + ' src="' + assets.publicPath + assets.entry[chunkName].js + '"></script>');
            }
        }
        return scriptHtml.join('');
    }
    //生成css
    getFullCss(assets , name = false, isPreload = false){
        let cssHtml = [];

        let chunks = this.options.chunks || [];
        let cssOptions = this.options.cssOptions || [];
        let preList = [];
        for ( let i = 0 ; i < chunks.length ; i++ ){
            let chunkName = chunks[i];
            if (name && chunkName !== name){
                continue;
            }
            let attrs = [].concat(Array.isArray(cssOptions) ? cssOptions : typeof cssOptions === 'object' && Array.isArray(cssOptions[chunkName]) ? cssOptions[chunkName] : []);
            let index = attrs.length ? attrs.findIndex((e)=>e.trim() === 'rel="preload"') : -1;
            if (!assets.entry[chunkName] || !assets.entry[chunkName].css){
                continue;
            }
            let arr = assets.entry[chunkName].css;
            for ( let j = 0 ; j < arr.length; j ++ ){
                if ( arr[j] ){
                    if (isPreload){
                        if (index >= 0 && !preList.includes(assets.publicPath + arr[j])){
                            cssHtml.push('<link ' + ['rel="preload"', 'as="style"'].join(' ') + ' href="' + assets.publicPath + arr[j] + '"/>');   
                            preList.push(assets.publicPath + arr[j]);
                        }
                    }else {
                        if (index >= 0){
                            attrs.splice(index, 1);
                        }
                        cssHtml.push('<link rel="stylesheet" ' + attrs.join(' ') + ' href="' + assets.publicPath + arr[j] + '"/>');
                    }
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