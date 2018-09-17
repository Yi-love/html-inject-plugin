# Html-inject-plugin
this is a plugin use webpack.

## npm
```
```

```js
new HtmlInjectPlugin({
    filename: 'test.html',
    chunks:['vue' , 'test'],
    template: path.resolve(__dirname , 'template.html')
});
```

```html
//template.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>test</title>
    <!-- inject:css:header -->
</head>
<body>
    <div class="body-wrapper">
       <div id="headerApp">header</div>
        <div class="main-warpper">
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

```
<!-- inject:(css|js)(entry)? -->
```