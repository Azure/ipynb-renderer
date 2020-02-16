var nbv = (function() {
    "use strict";

    var d = document;
    var st = {}; // settings

    function render_ipynb(obj, target, settings) {
        if (!window.marked || !window.Prism) {
            var errMsg_NoLib = "Expecting libraries marked.js and Prism.js to be present. Please report the rendering issue at <a href='https://marketplace.visualstudio.com/items?itemName=ms-air-aiagility.ipynb-renderer' target='_blank'>Jupyter Notebook Renderer Extension Page</a>.";
            throw(errMsg_NoLib);
        }
        st = settings || {};

        // validate nbformat property
        st.nbformat = obj.nbformat;
        if (typeof st.nbformat == 'undefined')
        {
            var errMsg_NoNbformat = "The notebook file doesn't have nbformat property. Please define it. This extension can only render notebook whose nbformat is 4 or above.";
            throw(errMsg_NoNbformat);
        }
        else if (st.nbformat < 4) 
        {
            var errMsg_LowFormat = "This extension can only render notebook whose nbformat is 4 or above. If you have an older version of notebook, please use \"jupyter nbconvert --to=notebook --inplace --nbformat=4\" to convert it first.";
            throw(errMsg_LowFormat);
        }

        // NOTE: nbformat 4 schema is specified at:
        // https://github.com/jupyter/nbformat/blob/11903688167d21af96c92f7f5bf0634ab51819f1/nbformat/v4/nbformat.v4.schema.json
        // validate metadata property
        if (typeof obj.metadata == 'undefined')
        {
            var errMsg_NoNbMetadata = "Malformed notebook file: it doesn't have metadata property.";
            throw(errMsg_NoNbMetadata);
        }

        // figure out notebook language
        // first choice: if launage_info exists, use the required property name
        // second choice: if kernelspec exists, try to use the optional property language
        // final choice: use python as default language
        var langInfo = obj.metadata.language_info;
        if (typeof langInfo != 'undefined')
        {
            if (typeof langInfo.name == 'undefined')
            {
                var errMsg_NoLanuageInfoName = "Malformed notebook file: it doesn't have required property metadata.language_info.name.";
                throw(errMsg_NoLanuageInfoName);
            }

            st.lang = langInfo.name;
            st.pygments_lexer = langInfo.pygments_lexer || langInfo.name;
        }
        else 
        {
            st.lang = (obj.metadata.kernelspec && obj.metadata.kernelspec.language) || "python";
        }

        // wipe all inner elements of our target
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }
        var t = d.createElement('div');
        t.setAttribute('id', 'notebook-container');
        target.appendChild(t);
        st.target = t;

        // v4 has cells directly in the object, v3 had a list of
        // worksheets, each with a list of cells
        var cells = obj.cells || function() {
            var ret = [];
            for (var j=0; j < obj.worksheets.length; j++) {
                ret = ret.concat(obj.worksheets[j].cells);
            }
            return ret;
        }();

        for (var j=0; j < cells.length; j++) {
            var tc = cells[j];

            var cell = d.createElement('div'); // empty div as a fallback

            switch (tc.cell_type) {
                case 'code':
                    cell = handle_code(tc);
                    break;
                case 'markdown':
                    cell = handle_mdown_or_raw(tc, true);
                    break;
                case 'raw':
                    cell = handle_mdown_or_raw(tc, false);
                    break;

                default:
                    throw('Unsupported cell type: ' + tc.cell_type);
            }
            t.appendChild(cell);
        }
    }

    function excount(cell, tin) {
        var cc = d.createElement('div');
        cc.setAttribute('class', 
            tin? 'prompt input_prompt': 'prompt output_prompt');
        cc.innerHTML = (tin ? 'In': 'Out') + '&nbsp;' + '[' +
            ((!cell.execution_count && !cell.prompt_number) ? ' ' :
                (cell.execution_count || cell.prompt_number)) + ']:';
        return cc;
    }

    // receives cell, outputs DOM
    function handle_code(cell) {
        // ignore the cell which has no source, no output and no execution_count
        if (!cell.execution_count && (cell.source.length == 0) && (cell.outputs.length == 0)) {
            console.log('ignore the empty code cell');
            return d.createElement('div');
        }

        // container for the code cell
        var ccDiv = d.createElement('div'); 
        ccDiv.setAttribute('class', 'cell border-box-sizing code_cell rendered');

        // container for the input part
        var inputDiv = d.createElement('div');
        inputDiv.setAttribute('class', 'input');
        ccDiv.appendChild(inputDiv);

        // container for execution count
        inputDiv.appendChild(excount(cell, true));

        // container for inner_cell
        var innerCellDiv = d.createElement('div');
        innerCellDiv.setAttribute('class', 'inner_cell');
        inputDiv.appendChild(innerCellDiv);

        // container for input_area
        var inputAreaDiv = d.createElement('div');
        inputAreaDiv.setAttribute('class', 'input_area');
        innerCellDiv.appendChild(inputAreaDiv);

        // container for the code
        var codeDiv = d.createElement('div');
        codeDiv.setAttribute('class', 'highlight hl_' + st.pygments_lexer);
        inputAreaDiv.appendChild(codeDiv);

        var pre = d.createElement('pre');
        var code = d.createElement('code');
        code.setAttribute('class', 'language-' + (!cell.language ? st.lang: cell.language) );
        // no need to join on '\n' - newlines are in the code already
        // .source for v4, .input for v3
        var raw_source = (cell.source || cell.input)
        code.textContent = get_data_content(raw_source);
        pre.appendChild(code);
        codeDiv.appendChild(pre);
        Prism.highlightElement(code);

        // outputs now

        // container for output wrapper
        var owDiv = d.createElement('div');
        owDiv.setAttribute('class', 'output_wrapper');
        ccDiv.appendChild(owDiv);

        // container for output
        var outDiv = d.createElement('div');
        outDiv.setAttribute('class', 'output');
        owDiv.appendChild(outDiv);

        for (var j=0; j < cell.outputs.length; j++) {
            // container for output area
            var outAreaDiv = d.createElement('div');
            outAreaDiv.setAttribute('class', 'output_area');
            outDiv.appendChild(outAreaDiv);

            var dt = cell.outputs[j];
            if (dt.output_type == 'execute_result') {
                outAreaDiv.appendChild(excount(dt, false));
            }
            else {
                var outPromptDiv = d.createElement('div');
                outPromptDiv.setAttribute('class', 'prompt');
                outAreaDiv.appendChild(outPromptDiv);
            }

            switch (dt.output_type) {
                case 'execute_result':
                    outAreaDiv.appendChild(handle_cell_output(dt, true));
                    break;
                case 'stream':
                    outAreaDiv.appendChild(handle_stream_output(dt));
                    break;
                case 'pyerr': // v3
                case 'error': // v4
                    outAreaDiv.appendChild(handle_error_cell(dt));
                    break;
                case 'display_data':
                    if (st.nbformat > 3) {
                        outAreaDiv.appendChild(handle_cell_output(dt, false));
                        break;
                    }
                    // if 3, fall through to pyout
                case 'pyout':
                    // legacy (v3)
                    outAreaDiv.appendChild(handle_pyout(dt));
                    break;
                default:
                    throw('Not supported output_type: ' +
                        cell.outputs[j].output_type);
            }
        }

        return ccDiv;
    }

    function handle_cell_output(dt, texe_result) {
        var el = d.createElement('div');
        el.setAttribute('class', 'output_text output_subarea' + (texe_result? ' output_execute_result': ''));

        // individual outputs
        var hasValidFormat = false;
        var invalidFormat = null;

        var fmts = Object.keys(dt.data);
        for (var j=0; j < fmts.length; j++) {
            var fmt = fmts[j];
            var dm = d.createElement('div');
            switch (fmt) {
                case 'text/plain':
                    // text/plain might be just a fallback here
                    // fixed #10
                    if (fmts.includes('text/html') || fmts.includes('text/markdown')) 
                        continue;

                    dm = d.createElement('pre');
                    dm.style.margin = 0;
                    dm.textContent = get_data_content(dt.data[fmt]);
                    hasValidFormat = true;
                    break;

                case 'text/html':
                    dm.innerHTML = get_data_content(dt.data[fmt]);

                    // we may have generated some HTML tables we need to style
                    var dfs = dm.getElementsByClassName('dataframe');
                    for (var k=0; k < dfs.length; k++) {
                        dfs[k].setAttribute('style', [
                            'border-collapse: collapse',
                            'text-align: left'
                            // 'margin-top: 1em'
                        ].join(';'));

                        // let's style individual cells as well
                        var cl = dfs[k].querySelectorAll('td, th');
                        for (var l=0; l < cl.length; l++) {
                            cl[l].style.padding = '3px';
                        }
                    }

                    hasValidFormat = true;
                    break;

                case 'text/markdown':
                    dm.innerHTML = marked(get_data_content(dt.data[fmt]));
                    hasValidFormat = true;
                    break;

                case 'image/svg+xml':
                    dm.innerHTML = get_data_content(dt.data[fmt]);
                    hasValidFormat = true;
                    break;

                default:
                    if (fmt.startsWith('image/')) {
                        dm = d.createElement('img');
                        dm.setAttribute('src', 'data:' + fmt + ';base64,' + get_data_content(dt.data[fmt]));

                        // use width and height attributes supplied in metadata
                        if (fmt in dt.metadata) {
                            var metadata = dt.metadata[fmt];
                            if ('width' in metadata) {
                                dm.setAttribute('width', metadata.width);
                            }
                            if ('height' in metadata) {
                                dm.setAttribute('height', metadata.height);
                            }
                        }

                        hasValidFormat = true;
                        break;
                    }
                    
                    // this is an unexpected format. Instead of directly throwing the error, we
                    // make it more robust by only throwing the error if this is the ONLY format
                    // for the current cell output
                    invalidFormat = fmt;
                
            } // end of switch

            el.appendChild(dm);
        } // end of for loop

        if (!hasValidFormat)
        {
            if (invalidFormat)
            {
                throw('unexpected format: ' + invalidFormat);
            }
            else 
            {
                throw('missing format for the cell output');
            }

        }

        return el;
    }

    function get_data_content(format_data)
    {
        if (Array.isArray(format_data))
        {
            return format_data.join('');
        }
        else if (typeof format_data == 'string')
        {
            return format_data;
        }
        else 
        {
            return format_data.toString();
        }
    }

    function handle_error_cell(dt) {
        var el = d.createElement('div');
        el.setAttribute('class', 'output_subarea output_text output_error');

        var cn = d.createElement('pre');
        var txt = dt.traceback.join('\n');
        cn.textContent = txt;

        el.appendChild(cn);
        return el;
    }

    function handle_stream_output(dt) {
        // name in v4, stream in v3
        var outt = dt.name || dt.stream; // v4 || v3; contains 'stdout' or 'stderr'

        if (!dt.hasOwnProperty('text'))
            throw('data for stream missing');

        var el = d.createElement('div');
        el.setAttribute('class', 
            'output_subarea output_stream output_text ' + (outt == 'stderr' ? 'output_stderr': 'output_stdout'));

        var cn = d.createElement('pre');
        cn.textContent = get_data_content(dt.text);
        el.appendChild(cn);

        return el;
    }

    function handle_mdown_or_raw(cell, isMarkdown) {
        // container for the markdown or raw cell
        var mdDiv = d.createElement('div');
        mdDiv.setAttribute('class', 'cell border-box-sizing text_cell rendered');

        // container for the empty input_prompt
        var inPromptDiv = d.createElement('div');
        inPromptDiv.setAttribute('class', 'prompt input_prompt');
        mdDiv.appendChild(inPromptDiv);

        // container for inner cell
        var innerCellDiv = d.createElement('div');
        innerCellDiv.setAttribute('class', 'inner_cell');
        mdDiv.appendChild(innerCellDiv);

        // container for the markdown or raw content
        var mdcontentDiv = d.createElement('div');
        mdcontentDiv.setAttribute('class', 'text_cell_render border-box-sizing rendered_html');
        mdcontentDiv.innerHTML = 
            isMarkdown ? marked(get_data_content(cell.source)) : get_data_content(cell.source);
        innerCellDiv.appendChild(mdcontentDiv);

        return mdDiv;
    }

    // handling legacy notebooks (v3)
    function handle_pyout(cell) {
        var el = d.createElement('div');

        if (cell.hasOwnProperty('prompt_number'))
            el.appendChild(excount(cell, false));

        // var ks = Object.keys(cell)
        // text, png, jpeg, html -- supported
        // svg, latex, javascript, json, pdf, metadata -- not yet
        Object.keys(cell).forEach(function(k) {
            if (['output_type', 'prompt_number'].indexOf(k) > -1)
                return;
            var p = d.createElement('span'); // if errs
            switch (k) {
                case 'text':
                    p = d.createElement('pre');
                    p.style.margin = 0;
                    p.textContent = get_data_content(cell[k]);
                    break;
                case 'html':
                    p = d.createElement('div');
                    // guessing here, haven't seen a v3 HTML element
                    p.innerHTML = get_data_content(cell[k]);
                    break;
                case 'png':
                case 'jpeg':
                    p = d.createElement('img');
                    p.setAttribute('src', 'data:' + k + ';base64,' + cell[k]);

                    break;

                default:
                    throw('unsupported pyout format: ' + k);
            }
            el.appendChild(p);
        });

        return el;
    }

    function sanitise(el) {
        return el.toLowerCase().replace(/\W+/g, '-');
    }

    function render_error(message, target) {
        // wipe all inner elements of our target
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }

        var t = d.createElement('div');
        t.setAttribute('class', 'alert alert-danger');
        t.innerHTML = message;
        target.appendChild(t);
    }

    return {
        render: render_ipynb,
        render_error: render_error
    };

})();
