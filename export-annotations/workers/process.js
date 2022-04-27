const Logger = require('../lib/utils/logger');
const config = require('../config');
const fs = require('fs');
const sizeOf = require('image-size');
const { create } = require('xmlbuilder2', { encoding: 'utf-8' });
const { execSync } = require("child_process");
const { Worker, workerData, parentPort } = require('worker_threads');

const jobId = workerData;
const MAGIC_MYSTERY_NUMBER = 2;

const logger = new Logger('presAnn Process Worker');
logger.info("Processing PDF for job " + jobId);

const kickOffNotifierWorker = (jobType) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./workers/notifier.js', { workerData: [jobType, jobId] });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`PresAnn Notifier Worker stopped with exit code ${code}`));
        })
    })
}

function color_to_hex(color) {
    color = parseInt(color).toString(16)
    return '0'.repeat(6 - color.length) + color
}

function scale_shape(dimension, coord) {
    return (coord / 100.0 * dimension);
}

function render_HTMLTextBox(htmlFilePath, id, width, height) {
    let commands = [
        'wkhtmltoimage',
        '--format', 'png',
        '--encoding', `${config.process.whiteboardTextEncoding}`,
        '--transparent',
        '--crop-w', width,
        '--crop-h', height,
        '--log-level', 'none',
        '--quality', '100',
        htmlFilePath, `${dropbox}/text${id}.png`
    ]

    execSync(commands.join(' '), (error, stderr) => {
        if (error) {
            logger.error(`Error when rendering text box for string "${string}" with wkhtmltoimage: ${error.message}`);
        }

        if (stderr) {
            logger.error(`stderr when rendering text box for string "${string}" with wkhtmltoimage: ${stderr}`);
        }
    })
}

function overlay_ellipse(svg, annotation, w, h) {
    let shapeColor = color_to_hex(annotation.color);
    let fill = annotation.fill ? `#${shapeColor}` : 'none';

    let x1 = scale_shape(w, annotation.points[0])
    let y1 = scale_shape(h, annotation.points[1])
    let x2 = scale_shape(w, annotation.points[2])
    let y2 = scale_shape(h, annotation.points[3])

    let width_r = Math.abs(x2 - x1) / 2
    let height_r = Math.abs(y2 - y1) / 2
    let hx = Math.abs(x1 + x2) / 2
    let hy = Math.abs(y1 + y2) / 2

    // Normalize the x,y coordinates
    if (x1 > x2) {
        [x1, x2] = [x2, x1]
    }

    if (y1 > y2) {
        [y1, y2] = [y2, y1]
    }

    let path = `M${x1} ${hy}
                A${width_r} ${height_r} 0 0 1 ${hx} ${y1}
                A${width_r} ${height_r} 0 0 1 ${x2} ${hy}
                A${width_r} ${height_r} 0 0 1 ${hx} ${y2}
                A${width_r} ${height_r} 0 0 1 ${x1} ${hy}
                Z`

    svg.ele('g', {
        style: `stroke:#${shapeColor};stroke-width:${scale_shape(w, annotation.thickness)};
                fill:${fill};stroke-linejoin:miter;stroke-miterlimit:8`
    }).ele('path', {
        d: path
    }).up()
}

function overlay_line(svg, annotation, w, h) {
    let shapeColor = color_to_hex(annotation.color);

    svg.ele('g', {
        style: `stroke:#${shapeColor};stroke-width:${scale_shape(w, annotation.thickness)};stroke-linecap:butt`
    }).ele('line', {
        x1: scale_shape(w, annotation.points[0]),
        y1: scale_shape(h, annotation.points[1]),
        x2: scale_shape(w, annotation.points[2]),
        y2: scale_shape(h, annotation.points[3]),
    }).up()
}

function overlay_pencil(svg, annotation, w, h) {
    let shapeColor = color_to_hex(annotation.color);

    if (annotation.points.length < 2) {
        logger.info("Pencil doesn't have enough points")
    }

    else if (annotation.points.length == 2) {
        svg.ele('g', {
            style: `stroke:none;fill:#${shapeColor}`,
        }).ele('circle', {
            cx: scale_shape(w, annotation.points[0]),
            cy: scale_shape(h, annotation.points[1]),
            r:  scale_shape(w, annotation.thickness) / 2
        }).up()
    }

    else {
        let x;
        let y;
        let path =  ""
        let dataPoints = annotation.points

        for(let command of annotation.commands) {
            switch(command){
                case 1: // MOVE TO
                    x = scale_shape(w, dataPoints.shift())
                    y = scale_shape(h, dataPoints.shift())
                    path = `${path} M${x} ${y}`
                    break;
                case 2: // LINE TO
                    x = scale_shape(w, dataPoints.shift())
                    y = scale_shape(h, dataPoints.shift())
                    path = `${path} L${x} ${y}`
                    break;
                case 4: // C_CURVE_TO
                    let cx1 = scale_shape(w, dataPoints.shift())
                    let cy1 = scale_shape(h, dataPoints.shift())
                    let cx2 = scale_shape(w, dataPoints.shift())
                    let cy2 = scale_shape(h, dataPoints.shift())
                    x = scale_shape(w, dataPoints.shift())
                    y = scale_shape(h, dataPoints.shift())
                    path = `${path} C${cx1} ${cy1},${cx2} ${cy2},${x} ${y}`
                    break;
                default:
                    logger.error(`Unknown pencil command: ${annotation.commands[i]}`)       
            }
        }

        svg.ele('g', {
            style: `stroke:#${shapeColor};stroke-linecap:round;stroke-linejoin:round;
            stroke-width:${scale_shape(w, annotation.thickness)};fill:none`
        }).ele('path', {
            d: path
        }).up()
    }
}

function overlay_poll(svg, annotation, w, h) {
    if (annotation.result.length == 0) {
        return;
    }

    let poll_x = scale_shape(w, annotation.points[0]);
    let poll_y = scale_shape(h, annotation.points[1]);
    let poll_width = Math.round(scale_shape(w, annotation.points[2]));
    let poll_height = Math.round(scale_shape(h, annotation.points[3]));
    let pollId = annotation.id.replace(/\//g, '');
    let pollSVG = `${dropbox}/poll-${pollId}.svg`
    let pollJSON = `${dropbox}/poll-${pollId}.json`

    // Rename 'numVotes' key to 'num_votes'
    let pollJSONContent = annotation.result.map(result => {
        result.num_votes = result.numVotes;
        delete result.numVotes;
        return result;
    });

    // Store the poll result in a JSON file
    fs.writeFileSync(pollJSON, JSON.stringify(pollJSONContent), function(err) {
        if(err) { return logger.error(err); }
    });

    // Create empty SVG poll
    fs.writeFileSync(pollSVG, '', function(err) {
        if(err) { return logger.error(err); }
    });

    // Render the poll SVG using gen_poll_svg script
    execSync(`${config.genPollSVG.path} -i ${pollJSON} -w ${poll_width} -h ${poll_height} -n ${annotation.numResponders} -o ${pollSVG}`, (error, stderr) => {
        if (error) {
            return logger.error(`Poll generation failed with error: ${error.message}`);
        }

        if (stderr) {
            return logger.error(`Poll generation failed with stderr: ${stderr}`);
        }
    });

    // Add poll image element
    svg.ele('image', {
        'xlink:href': `file://${pollSVG}`,
        x: poll_x,
        y: poll_y,
        width: poll_width,
        height: poll_height,
    })
}

function overlay_rectangle(svg, annotation, w, h) {
    let shapeColor = color_to_hex(annotation.color);
    let fill = annotation.fill ? `#${shapeColor}` : 'none';
    
    let x1 = scale_shape(w, annotation.points[0])
    let y1 = scale_shape(h, annotation.points[1])
    let x2 = scale_shape(w, annotation.points[2])
    let y2 = scale_shape(h, annotation.points[3])

    let path = `M${x1} ${y1} L${x2} ${y1} L${x2} ${y2} L${x1} ${y2} Z`

    svg.ele('g', {
        style: `stroke:#${shapeColor};stroke-width:${scale_shape(w, annotation.thickness)};fill:${fill};stroke-linejoin:miter`
    }).ele('path', {
        d: path
    }).up()
}

function overlay_triangle(svg, annotation, w, h) {
    let shapeColor = color_to_hex(annotation.color);
    let fill = annotation.fill ? `#${shapeColor}` : 'none';
    
    let x1 = scale_shape(w, annotation.points[0])
    let y1 = scale_shape(h, annotation.points[1])
    let x2 = scale_shape(w, annotation.points[2])
    let y2 = scale_shape(h, annotation.points[3])

    let px = (x1 + x2) / 2

    let path = `M${px} ${y1} L${x2} ${y2} L${x1} ${y2} Z`

    svg.ele('g', {
        style: `stroke:#${shapeColor};stroke-width:${scale_shape(w, annotation.thickness)};fill:${fill};stroke-linejoin:miter;stroke-miterlimit:8`
    }).ele('path', {
        d: path
    }).up()
}

function overlay_text(svg, annotation, w, h) {

    let fontColor = color_to_hex(annotation.fontColor);
    let textBoxWidth = Math.round(scale_shape(w, annotation.textBoxWidth));
    let textBoxHeight = Math.round(scale_shape(h, annotation.textBoxHeight));
    let textBox_x = Math.round(scale_shape(w, annotation.x));
    let textBox_y = Math.round(scale_shape(h, annotation.y));

    let fontSize = scale_shape(h, annotation.calcedFontSize)
    let style = [
        `width:${textBoxWidth}px;`,
        `height:${textBoxHeight}px;`,
        `color:#${fontColor};`,
        "word-wrap:break-word;",
        "font-family:Arial;",
        `font-size:${fontSize}px`
    ]

    var html = 
        `<!DOCTYPE html>
        <html>
            <p style="${style.join('')}">
                ${annotation.text.split('\n').join('<br>')}
            </p>
        </html>`;
    
    var htmlFilePath = `${dropbox}/text${annotation.id}.html`

    fs.writeFileSync(htmlFilePath, html, function (err) {
        if (err) logger.error(err)
    })

    render_HTMLTextBox(htmlFilePath, annotation.id, textBoxWidth, textBoxHeight)

    svg.ele('image', {
        'xlink:href': `file://${dropbox}/text${annotation.id}.png`,
        x: textBox_x,
        y: textBox_y - fontSize,
        width: textBoxWidth,
        height: textBoxHeight,
    }).up();
}

function overlay_annotations(svg, currentSlideAnnotations, w, h) {
    for(let annotation of currentSlideAnnotations) {        
        switch (annotation.annotationType) {
            case 'ellipse':
                overlay_ellipse(svg, annotation.annotationInfo, w, h);
                break;
            case 'line':
                overlay_line(svg, annotation.annotationInfo, w, h);
                break;
            case 'poll_result':
                overlay_poll(svg, annotation.annotationInfo, w, h);
                break;
            case 'pencil':
                overlay_pencil(svg, annotation.annotationInfo, w, h);
                break;
            case 'rectangle':
                overlay_rectangle(svg, annotation.annotationInfo, w, h);
                break;
            case 'text':
                overlay_text(svg, annotation.annotationInfo, w, h);
                break;
            case 'triangle':
                overlay_triangle(svg, annotation.annotationInfo, w, h);
                break;
            default:
                logger.error(`Unknown annotation type ${annotation.annotationType}.`);
        }
    }
}

// Process the presentation pages and annotations into a PDF file

// 1. Get the job
const dropbox = `${config.shared.presAnnDropboxDir}/${jobId}`
let job = fs.readFileSync(`${dropbox}/job`);
let exportJob = JSON.parse(job);

// 2. Get the annotations
let annotations = fs.readFileSync(`${dropbox}/whiteboard`);
let whiteboard = JSON.parse(annotations);
let pages = JSON.parse(whiteboard.pages);
let ghostScriptInput = ""

// 3. Convert annotations to SVG
for (let currentSlide of pages) {
    var dimensions = sizeOf(`${dropbox}/slide${currentSlide.page}.png`);
    var slideWidth = dimensions.width;
    var slideHeight = dimensions.height;

    var panzoom_x = -currentSlide.xOffset * MAGIC_MYSTERY_NUMBER / 100.0 * slideWidth
    var panzoom_y = -currentSlide.yOffset * MAGIC_MYSTERY_NUMBER / 100.0 * slideHeight
    var panzoom_w = scale_shape(slideWidth, currentSlide.widthRatio)
    var panzoom_h = scale_shape(slideHeight, currentSlide.heightRatio)

    // Create the SVG slide with the background image
    let svg = create({ version: '1.0', encoding: 'UTF-8' })
                .ele('svg', { 
                    xmlns: 'http://www.w3.org/2000/svg',
                    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                    width: slideWidth,
                    height: slideHeight,
                    viewBox: `${panzoom_x} ${panzoom_y} ${panzoom_w} ${panzoom_h}`
                })
                .dtd({ 
                    pubID: '-//W3C//DTD SVG 1.1//EN',
                    sysID: 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'
                })
                .ele('image', {
                    'xlink:href': `file://${dropbox}/slide${currentSlide.page}.png`,
                    width: slideWidth,
                    height: slideHeight,
                })
                .up()
                .ele('g', {
                    class: 'canvas'
                });

    // 4. Overlay annotations onto slides
    // Based on /record-and-playback/presentation/scripts/publish/presentation.rb
    overlay_annotations(svg, currentSlide.annotations, slideWidth, slideHeight)

    svg = svg.end({ prettyPrint: true });
    // Write annotated SVG file
    let SVGfile = `${dropbox}/annotated-slide${currentSlide.page}.svg`
    let PDFfile = `${dropbox}/annotated-slide${currentSlide.page}.pdf`

    fs.writeFileSync(SVGfile, svg, function(err) {
        if(err) { return logger.error(err); }
    });

    let convertAnnotatedSlide = [
        'cairosvg',
        SVGfile,
        '-o', PDFfile
    ].join(' ');

    execSync(convertAnnotatedSlide, (error, stderr) => {
        if (error) {
            return logger.error(`SVG to PDF export failed with error: ${error.message}`);
        }

        if (stderr) {
            return logger.error(`SVG to PDF export failed with stderr: ${stderr}`);
        }
    });

    ghostScriptInput += `${PDFfile} `
}

// Create PDF output directory if it doesn't exist
let output_dir = `${exportJob.presLocation}/pdfs`;
if (!fs.existsSync(output_dir)) { fs.mkdirSync(output_dir); }

let mergePDFs = [
    'gs',
    '-dNOPAUSE',
    '-sDEVICE=pdfwrite',
    `-sOUTPUTFILE=${output_dir}/annotated_slides_${jobId}.pdf`,
    `-dBATCH`,
    ghostScriptInput,
    ].join(' ');

// Resulting PDF file is stored in the presentation dir
execSync(mergePDFs, (error, stderr) => {
    if (error) {
        return logger.error(`SVG to PDF export failed with error: ${error.message}`);
    }

    if (stderr) {
        return logger.error(`SVG to PDF export failed with stderr: ${stderr}`);
    }
});

// Launch Notifier Worker depending on job type
logger.info(`Saved PDF at ${output_dir}/annotated_slides_${jobId}.pdf`);

kickOffNotifierWorker(exportJob.jobType);

parentPort.postMessage({ message: workerData })
