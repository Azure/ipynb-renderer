# Jupyter Notebook Renderer on Visual Studio Team Services Extension Change log

## [1.2.1] (2018.06.29)
* Release the initial preview version of Jupyter Notebook Renderer for VSTS

## [1.2.9] (2018.10.25)
* Minor change to look and feel. Make the extension public. 

## [1.3.0] (2018.11.29)
* Fix a dependency bug which causes installation failure on TFS 2017

## [1.3.1] (2019.03.25)
* Change the extensioin scopes from code_write to code, as it only needs to read the ipynb files. 
* Improve the exception handling. Will show friendly message when fails to render
* Support text/markdown rendering

## [1.3.2] (2019.05.24)
* Improve the exception handling by removing all the silent failures code paths during rendering. Now all rendering failures result in friendly and actionable error messages in the rendering panel
* Explicitly reject nbformat 3 notebooks. 

## [1.3.3] (2019.06.11)
* Improve rendering robustness: when a cell output contains multiple formats, as long as one of the format can be rendered, we don't fail the rendering. 

## [1.4.0] (2019.08.19)
* Two rendering bug fixes.
  1. support rendering cell_type == raw
  2. validate the output data content type before calling Array.join to avoid javascript type error. 

## [1.5.0] (2019.10.31)
* Improve rendering robustness: handle the cases when metadata.kernelspec doesn't exist, or metadata.kernelspec.language doesn't exist, or metadata.language_info doesn't exist. All these cases are allowed as per nbformat 4 spec, therefore we will render the notebook in these scenarios.
* Improve error reporting: for malformed notebook or required properties are missing (e.g. nbformat, metadata, metadata.languge_info.name etc), repor the exact error to user to reduce confusion.
* Update the contact email address in overview page. 

## [1.5.1] (2020.01.15)
* Improve rendering robustness: handle the cases output text or html is just a string, even though according to nbformat, it is expected to be an array.