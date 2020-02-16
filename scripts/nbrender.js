var notebookRenderer = (function () {
    "use strict";
    return {
        renderContent: function(rawContent, options) {
            
            var render_ux = document.getElementById("notebook-display");

            var validFormedJson = false;
            var jsonPayload;
            try 
            {
                jsonPayload = JSON.parse(rawContent);
                validFormedJson = true;
                nbv.render(jsonPayload, render_ux);
            }
            catch (err)
            {
                console.log(err);

                var errMsg;
                if (validFormedJson)
                {
                    // rendering failure
                    errMsg = "We cannot render this notebook. The detailed reason is: '" + err + "'. Please check the \"Known Issues\" from <a href='https://marketplace.visualstudio.com/items?itemName=ms-air-aiagility.ipynb-renderer' target='_blank'>Jupyter Notebook Renderer Extension Page</a>. If it's a new issue, please <a href=\"mailto:aml_ado_support@microsoft.com\" target='_blank'>contact us</a> by providing the detailed error message above. We will respond and look for the fix. Thanks for helping us to improve.";
                }
                else 
                {
                    // parsing failure
                    errMsg = "Failed to parse the notebook file as JSON. The detailed reason is: '" + err + "'. Please check the \"Known Issues\" from <a href='https://marketplace.visualstudio.com/items?itemName=ms-air-aiagility.ipynb-renderer' target='_blank'>Jupyter Notebook Renderer Extension Page</a>. If it's a new issue, please <a href=\"mailto:aml_ado_support@microsoft.com\" target='_blank'>contact us</a> by providing the detailed error message above. We will respond and look for the fix. Thanks for helping us to improve.";
                }

                nbv.render_error(errMsg, render_ux);
            }
        }
    };
}());

VSS.init({
    usePlatformScripts: true, 
    usePlatformStyles: true, 
    explicitNotifyLoaded: true 
});

VSS.ready(function () {
    VSS.register("ipynb_renderer", function (context) {
        return notebookRenderer;
    });

	VSS.notifyLoadSucceeded();
});