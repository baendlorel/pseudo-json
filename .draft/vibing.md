请做如下改造：
1、对于js文件，可以只做load，但是这个看用户喜欢
2、对于jsonc解析，支持单行注释，不支持多行、行内、行尾注释
3、对于jsonc解析，要求将单行注释解析为单行注释下方的字段名的comments数组属性值

- 解析jsonc的办法是：首先使用和parse函数一样的办法巧妙提取出对象，然后逐行扫描整个文件内容（即输入的字符串），找到每一行的注释内容，并将其与下一行的字段名进行关联，最终构建出一个新的对象，其中每个字段都是一个对象，包含value和comments两个属性。不要安装额外的解析器
  4、对于jsonc的解析结果是一个对象，对象的每个属性都是一个对象，包含value和comments两个属性，其中value是原来的属性值，comments是一个数组，包含该属性下的单行注释内容
  5、api：

- parseJsonc(content: string)，返回值为类型体操，要求接收一个interface，将其改造为每个字段都是value、comments的形式
- parseJS，也就是原来的那种情况

---

parse优化：
1、因为代码可能有逻辑部分，因此，首先要将代码分成两部分：上半部分是逻辑代码，下半部分是导出对象的代码。2、先把代码按行拆分，然后，必须是行首+可选的空格后，正则匹配到export default或者module.exports，并将它们作为分界线。
3、export default或者module.exports改为return，然后将全部代码join换行符起来，存入变量`code`中；
4、将code放入new Function的入参中，创建并执行函数，返回值即为解析结果
