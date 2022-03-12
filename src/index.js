const cheerio = require('cheerio');
const got = require('got');
const fs = require('fs');

if(!fs.existsSync("output")) {
    fs.mkdirSync("output")
}
async function fetchTopic(destination) {
    console.log("Loading post at: " + destination);
    if(fs.existsSync("output/"+destination.substring(1)+".txt")) {
        console.log("Duplicate");
        return
    }

    var htmlFile = "<dummy>" + fs.readFileSync(require.resolve("../manifest.html")) + "</dummy>";
	htmlFile = htmlFile.replace(/<p>/g, "");
	htmlFile = htmlFile.replace(/<\/p>/g, "");
	htmlFile = htmlFile.replace(/<span style=\"color: #16569E\"><span style=\"font-size: smaller\">\x28/g, "<post><time>");
	htmlFile = htmlFile.replace(/<span style=\"color: #A82F2F\"><span style=\"font-size: smaller\">\x28/g, "<post><time>");
	htmlFile = htmlFile.replace(/<span style=\"color: #062585\"><span style=\"font-size: smaller\">\x28/g, "<post><time>");
	htmlFile = htmlFile.replace(/<font color=\"#16569E\"><font size=\"2\">\x28/g, "<post><time>");
	htmlFile = htmlFile.replace(/<font color=\"#A82F2F\"><font size=\"2\">\x28/g, "<post><time>");
	htmlFile = htmlFile.replace(/<font color=\"#062585\"><font size=\"2\">\x28/g, "<post><time>");
	htmlFile = htmlFile.replace(/\x29<\/font> <b>\*\*\*/g, "</time><charname>");
	htmlFile = htmlFile.replace(/\x29<\/span> <b>\*\*\*/g, "</time><charname>");
	htmlFile = htmlFile.replace(/\x29<\/font> <b>/g, "</time><charname>");
	htmlFile = htmlFile.replace(/\x29<\/span> <b>/g, "</time><charname>");
	htmlFile = htmlFile.replace(/:<\/b><\/font>/g, "</charname><postcontent>");
	htmlFile = htmlFile.replace(/:<\/b><\/span>/g, "</charname><postcontent>");
	htmlFile = htmlFile.replace(/<\/b><\/font>/g, "</charname><postcontent>");
	htmlFile = htmlFile.replace(/<\/b><\/span>/g, "</charname><postcontent>");
	htmlFile = htmlFile.replace(/<br>/g, "</postcontent></post>");
    
    const $ = cheerio.load(htmlFile, { xmlMode: true})
    let result = [];

    console.log($("head").html())

    $("body").each(function(idx,elem) {
        // console.log(cheerio(this))
        const convoInfo = $(elem).find("h1").text().match(/(\d{4}.*) \d{2}:\d{2}:\d{2} CE/) || [];

        const convoDate = convoInfo[1] || 'unknown';

        console.log(convoDate);

        $(this).contents().each((idx,elem) => {
            if(elem.type === 'tag' && elem.name === 'post') {
			result.push({
				name: $(elem).find("charname").text().trim(),
				content: $(elem).find("postcontent").html().replace(/\n/g,"<br>").trim(),
				date: convoDate + " " + $(elem).find("time").text().trim(),
			})
            } 
        })
    });
    
    let processedResult = [];
    
    for (var i = 0; i < result.length; i++) {
        const processedIndex = processedResult.length - 1;
        if(i == 0) {
            processedResult.push(result[i]);
        } else if(processedResult[processedIndex].name === result[i].name) {
            processedResult[processedIndex].content = processedResult[processedIndex].content + '<br>\n' + result[i].content;
        } else {
            processedResult.push(result[i]);
        }
    } 
    
	fs.writeFile("output/raw.xml",htmlFile, function (err) {
  if (err) return console.log(err);
  console.log('Hello World > helloworld.txt');
});
    fs.writeFile("output/"+destination.substring(1)+".txt", processedResult.map(({name,content,date}) => {
    //console.log(processedResult.map(({name,content,date}) => {
            return (
                `{{RPG Post/${name}
|date=${date}
|post=${name} ${content.replace(/\*/g,"{{Str}}")}
}}`
                )
            }).join("\n"),() => {}
    );

};

fetchTopic("/nerida").then(() => console.log("finished"));
