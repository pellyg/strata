var path = require("path"),
    fs = require("fs"),
    markdown = require("markdown");

var manual = {};
manual.Chapter = Chapter;
manual.processChapter = processChapter;

module.exports = manual;

var manualDir = path.resolve(__dirname, "../doc");
var files = fs.readdirSync(manualDir).filter(function (file) {
    return (/\.js$/).test(file);
}).map(function (file) {
    return path.join(manualDir, file);
});

var chapter;
files.forEach(function (file) {
    chapter = new Chapter(file);
    manual[chapter.number] = chapter;
});

function Chapter(file) {
    this.file = file;

    var basename = path.basename(file, ".js");
    var parts = basename.split("_");

    // Extract chapter number and title from the file name.
    this.number = parts.shift();
    this.title = parts.map(function (part) {
        return part[0].toUpperCase() + part.substring(1);
    }).join(" ");
}

Chapter.prototype.__defineGetter__("code", function () {
    if (!this._code) {
        this._code = fs.readFileSync(this.file, "utf8");
    }

    return this._code;
});

Chapter.prototype.__defineGetter__("text", function () {
    if (!this._text) {
        this._text = processChapter(this.code);
    }

    return this._text;
});

Chapter.prototype.__defineGetter__("html", function () {
    if (!this._html) {
        var html = markdown.parse(this.text);

        // Repair broken links whose href ends with a ")" (markdown parsing error)
        html = html.replace(/(<a.*?href=".*?)\)(".*?>.*?<\/a>)/g, "$1$2)");

        this._html = html;
    }

    return this._html;
});

function processChapter(chapter) {
    var lines = chapter.split("\n"),
        inCode = true,
        output = [];

    // Doc sections start with a line containing only a /* and end
    // with a line containing only a */
    lines.forEach(function (line) {
        if (line == "/*") {
            inCode = false;
        } else if (line == "*/") {
            inCode = true;
        } else if (inCode) {
            output.push("    " + line);
        } else {
            output.push(line);
        }
    });

    return output.join("\n");
}