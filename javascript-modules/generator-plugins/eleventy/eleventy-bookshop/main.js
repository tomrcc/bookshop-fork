const path = require("path");
const fs = require("fs");

const getComponentKey = (name) => {
    const base = name.split("/").reverse()[0];
    return `components/${name}/${base}.eleventy.liquid`;
}

const bookshopTagHandler = (locations, baseLocation) => (liquidEngine) => {
    return {
        parse: function (tagToken, remainingTokens) {
            const [, component, args] = tagToken.args.match(/^['"]?([^\s'"]+)['"]?\s(.*)$/);
            const componentKey = getComponentKey(component);
            for (let location of locations) {
                const componentPath = path.join(baseLocation, location, componentKey);
                if (fs.existsSync(componentPath)) {
                    // TODO: Parse this based on the configured _includes dir
                    const relativeIncludePath = path.join('../', location, componentKey);
                    this.output = `{% include ${relativeIncludePath} ${args} %}`;
                    return;
                }
            };
            console.error(`Bookshop: Could not find component ${component} in any of [ ${locations.join(',')} ]`);
            process.exit(1);
        },
        render: function (scope, hash) {
            const tpl = liquidEngine.parse(this.output);
            // TODO: This feels wrong. Does 11ty ever give us multiple contexts?
            // TODO: Ideally we should be able to pass the whole scope to liquidjs
            const output = liquidEngine.render(tpl, scope.contexts[0]);
            return output;
        }
    };
}

module.exports = (bookshopConfig) => {
    const locations = bookshopConfig.bookshopLocations || [];
    // This should be the path of the site .eleventy.js
    const baseLocation = path.dirname(module.parent.filename);
    return function (eleventyConfig) {
        eleventyConfig.bookshopOptions = { locations, baseLocation };
        eleventyConfig.addLiquidTag("bookshop", bookshopTagHandler(locations, baseLocation));
    };
}