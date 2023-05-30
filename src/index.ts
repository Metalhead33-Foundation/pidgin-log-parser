import cheerio from 'cheerio';
import got from 'got';
import fs from 'fs';

// Interfaces
interface Replacement {
    pattern: RegExp;
    replacement: string;
}

interface ProcessedResult {
    name: string;
    content: string;
    date: string;
}

// Create the 'output' directory if it doesn't exist
if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
}

// Function to read the HTML file
function readHTMLFile(): string {
    return `<dummy>${fs.readFileSync(require.resolve('../manifest.html'))}</dummy>`;
}

// Function to perform HTML tag replacements
function performTagReplacements(htmlFile: string): string {
    const replacements: Replacement[] = [
        { pattern: /<p>/g, replacement: '' },
        { pattern: /<\/p>/g, replacement: '' },
        { pattern: /<span style="color: #16569E"><span style="font-size: smaller">\x28/g, replacement: '<post><time>' },
        { pattern: /<span style="color: #A82F2F"><span style="font-size: smaller">\x28/g, replacement: '<post><time>' },
        { pattern: /<span style="color: #062585"><span style="font-size: smaller">\x28/g, replacement: '<post><time>' },
        { pattern: /<font color="#16569E"><font size="2">\x28/g, replacement: '<post><time>' },
        { pattern: /<font color="#A82F2F"><font size="2">\x28/g, replacement: '<post><time>' },
        { pattern: /<font color="#062585"><font size="2">\x28/g, replacement: '<post><time>' },
        { pattern: /\x29<\/font> <b>\*\*\*/g, replacement: '</time><charname>' },
        { pattern: /\x29<\/span> <b>\*\*\*/g, replacement: '</time><charname>' },
        { pattern: /\x29<\/font> <b>/g, replacement: '</time><charname>' },
        { pattern: /\x29<\/span> <b>/g, replacement: '</time><charname>' },
        { pattern: /:<\/b><\/font>/g, replacement: '</charname><postcontent>' },
        { pattern: /:<\/b><\/span>/g, replacement: '</charname><postcontent>' },
        { pattern: /<\/b><\/font>/g, replacement: '</charname><postcontent>' },
        { pattern: /<\/b><\/span>/g, replacement: '</charname><postcontent>' },
        { pattern: /<br>/g, replacement: '</postcontent></post>' },
    ];

    for (const { pattern, replacement } of replacements) {
        htmlFile = htmlFile.replace(pattern, replacement);
    }

    return htmlFile;
}

// Function to process the extracted data
function processExtractedData(result: ProcessedResult[]): ProcessedResult[] {
    let processedResult: ProcessedResult[] = [];

    // Process the result
    for (let i = 0; i < result.length; i++) {
        const processedIndex = processedResult.length - 1;
        if (i === 0) {
            processedResult.push(result[i]);
        } else if (processedResult[processedIndex].name === result[i].name) {
            processedResult[processedIndex].content += '<br>\n' + result[i].content;
        } else {
            processedResult.push(result[i]);
        }
    }

    return processedResult;
}

// Function to format the processed result
function formatProcessedResult(result: ProcessedResult[]): string {
    return result
        .map(({ name, content, date }) => {
            return `{{RPG Post/${name}
|date=${date}
|post=${name} ${content.replace(/\*/g, '{{Str}}')}
}}`;
        })
        .join('\n');
}

function extractData(htmlFile: string): ProcessedResult[] {
    const $ = cheerio.load(htmlFile, { xmlMode: true });
    let result: ProcessedResult[] = [];

    console.log($('head').html());

    // Iterate over 'body' elements
    $('body').each((idx, elem) => {
        const convoInfo = $(elem).find('h1').text().match(/(\d{4}.*) \d{2}:\d{2}:\d{2} CE/) || [];
        const convoDate = convoInfo[1] || 'unknown';

        console.log(convoDate);

        // Iterate over child nodes
        $(elem)
            .contents()
            .each((idx: number, elem: cheerio.Element) => {
                if (elem != null && elem.type === 'tag' && elem.name === 'post') {
                    const postContentElem = $(elem).find('postcontent');
                    let content = postContentElem.length > 0 ? postContentElem.html() : '';
                    content = content != null ? content.replace(/\n/g, '<br>').trim() : '';
                    result.push({
                        name: $(elem).find('charname').text().trim(),
                        content: content,
                        date: convoDate + ' ' + $(elem).find('time').text().trim()
                    });
                }
            });
    });
    return result;
}


// Function to fetch the topic
async function fetchTopic(destination: string): Promise<void> {
    console.log('Loading post at: ' + destination);
    if (fs.existsSync(`output/${destination.substring(1)}.txt`)) {
        console.log('Duplicate');
        return;
    }

    let htmlFile = readHTMLFile();
    htmlFile = performTagReplacements(htmlFile);

    // Write the raw HTML file
    fs.writeFile('output/raw.xml', htmlFile, function (err) {
        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
    });

    // Write the processed result
    fs.writeFile(`output/${destination.substring(1)}.txt`, formatProcessedResult(processExtractedData(extractData(htmlFile))), () => {});
}

// Fetch the topic and log "finished" when done
fetchTopic('/nerida').then(() => console.log('finished'));