# Html-inject-plugin
this is a plugin use webpack4.

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

## synx

```
<!-- inject:(css|js)(entry)? -->
```

## example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%=title%></title>
    <link rel="stylesheet" href="http:/www.test.com/dist/test.css?v=18c16ad2a2132b655533"/>
    <!-- inject:css -->
</head>
<body>
    <div class="body-wrapper">
       <div id="headerApp">header</div>
        <div class="main-warpper">
            <div id="sidebarApp">sidebar</div>
            <div class="main-container">
                <%=render.content%>
            </div>
        </div>
        <div id="footerApp">footer</div> 
    </div>
    <script src="http:/www.test.com/dist/vue.js?v=2981d8bb85bde7e5ce33"></script>
<script src="http:/www.test.com/dist/test.js?v=2981d8bb85bde7e5ce33"></script>
<!-- inject:js -->
</body>
</html>
```