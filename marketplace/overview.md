## Jupyter Notebook Renderer
Render Jupyter Notebook inline. 

## How to Use
### Install this extension to your Azure DevOps account

### Choose any Jupyter Notebook (.ipynb) file in your repo. The preview pane will show the rendered content of Jupyter Notebook.

![Preview Notebook](marketplace/images/Preview.png)

## Known Issues
* Any Jupyter Notebook (*.ipynb) file bigger than 5MB will be truncated and cannot be rendered successfully

* Jupyter Notebook format lower than 4 (nbformat field in the ipynb file) is not supported. You can use nbconvert tool to convert the older format Jupyter Notebook to nbformat 4 or higher first. 

`
jupyter nbconvert --to=notebook --inplace --nbformat=4 <your-notebook-filename>
`

## Prerequisites

- Team Services

## Contributors

Microsoft "Cloud AI Infra" team: https://repos.opensource.microsoft.com/Microsoft/teams/cloud-ai-infra

## Feedback

We need your feedback! Here are some of the ways to connect with us:

- Add a review below
- Send us an [email](mailto://aml_ado_support@microsoft.com).

## Important Note 
Version 1.3.1, published on 3/25/2019, contains a fix which downgrades the required scope from code_write to code. As a result, if you have pervious version of this extension installed, please **authorize** the request of scope change, as shown in the screen shot below. This actually makes it *safer* to run this extension!

![Authorize Scope Change](marketplace/images/change_scope_auth.png)

--------


-------
[View Notices](marketplace/ThirdPartyNotices.txt) for third party software included in this extension.

-------
> Microsoft DevLabs is an outlet for experiments from Microsoft, experiments that represent some of the latest ideas around developer tools. Solutions in this category are designed for broad usage, and you are encouraged to use and provide feedback on them; however, these extensions are not supported nor are any commitments made as to their longevity.