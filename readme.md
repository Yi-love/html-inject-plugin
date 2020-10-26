# Html-inject-plugin
inject `<link>` and `<script>` to output file.  this is a webpack4 plugin.

## npm
```
npm install --save-dev html-inject-plugin
```

## use

```js
new HtmlInjectPlugin({
    filename: 'test.html',
    chunks:['vue' , 'test'],
    jsOptions: {
        vue: ['rel="preload"', 'crossorigin="anonymous"'],
        test: ['crossorigin="anonymous"']
    },
    cssOptions: ['rel="preload"', 'crossorigin="anonymous"'],
    template: path.resolve(__dirname , 'template.html')
});
```

### params

* filename
* chunks
* template

```html
//template.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>test</title>
    <!-- inject:preload -->
    <!-- inject:css -->
</head>
<body>
    <div class="body-wrapper">
       <div id="headerApp">header</div>
        <div class="main-wrapper">
            <div id="sidebarApp">sidebar</div>
            <div class="main-container">
            </div>
        </div>
        <div id="footerApp">footer</div> 
    </div>
    <!-- inject:js -->
</body>
</html>
```

## synx

* entry  入口文件的名称 

```
<!-- inject:(css|js)(:entry?) -->
```

## output file

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%=title%></title>
    <link ref="preload" rel="stylesheet" href="http:/www.test.com/dist/test.css?v=18c16ad2a2132b655533" as="style" />
    <link ref="preload" rel="stylesheet" href="http:/www.test.com/dist/vue.js?v=2981d8bb85bde7e5ce33" as="script"/>
    <!-- inject:preload -->

    <link rel="stylesheet" href="http:/www.test.com/dist/test.css?v=18c16ad2a2132b655533" crossorigin="anonymous"/>
    <!-- inject:css -->
</head>
<body>
    <div class="body-wrapper">
       <div id="headerApp">header</div>
        <div class="main-wrapper">
            <div id="sidebarApp">sidebar</div>
            <div class="main-container">
                <%=render.content%>
            </div>
        </div>
        <div id="footerApp">footer</div> 
    </div>
    <script crossorigin="anonymous" defer src="http:/www.test.com/dist/vue.js?v=2981d8bb85bde7e5ce33" ></script>
    <script crossorigin="anonymous" defer src="http:/www.test.com/dist/test.js?v=2981d8bb85bde7e5ce33"></script>
<!-- inject:js -->
</body>
</html>
```

## error

`html-loader`.

```
You may need an appropriate loader to handle this file type.
```
