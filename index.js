#! /usr/bin/env node

const fs = require('fs');
const parser = require('xml-js');
const YAML = require('yaml');
const path = require('path');


let info = {
    "lang": "json",
    "auth": "apikey",
    "config": ".",
    "folder": "",
    "info": "",
    "category": "Other"
};

let help_index = process.argv.indexOf('-help');
if(help_index != -1) {
    return console.log({
        "-lang": "json or yaml (default json) Example: -lang=json",
        "-config": "folder where your config.json file is located (default ./) Example: -config=/config",
        "-folder": "folder where your apiproxy bundle is located (default ./) Example: -folder=/apis/examples",
        "-cat": "[SalesAndMarketing, ConnectedTruck, Manufacturing, Other] (default Other) Example: -cat=Other",
        "-saveFolder": "folder name to save the file in a folder Example: -saveFolder=Done/",
        "-saveName": "customize file name Example -saveName=oas_file_v2_"
        });
}

info.lang = process.env.npm_config_out || 'json';
info.auth = process.env.npm_config_auth || 'apikey';
info.config = process.env.npm_config_config || '.';
info.folder = process.env.npm_config_folder || '';
info.category = process.env.npm_config_cat || 'Other';
info.saveFolder = process.env.npm_config_saveFolder || '';
info.saveName = process.env.npm_config_saveName|| 'oas_file_v2_';

console.log(info);

let name_of_file = '';
fs.readdirSync(`.${info.folder}/apiproxy/`).forEach(file => {

if(file.includes('.xml')) {
    name_of_file = file;
}
});

const xml_file = `.${info.folder}/apiproxy/${name_of_file}`;
const xml = fs.readFileSync(xml_file, { encoding: 'utf8', flag: 'r' });
var json_data = JSON.parse(parser.xml2json(xml, {
    compact: true,
    space: 4
}));

const product_name = json_data.APIProxy.BasePaths._text.split('/')[1];

let result = {};

result.openapi = "3.0.0";
result.servers = [];
result.tags = [
    {
        "name": product_name
    }
];

let text_temp =  json_data.APIProxy.Description._text;
text_temp = text_temp.toLowerCase().replace(/^./, str => str.toUpperCase());
let general_description = text_temp;
let long_description = "";
if(info.info == '') {
    general_description = json_data.APIProxy._attributes.name + " API rev "+json_data.APIProxy._attributes.revision;
    long_description = text_temp;
}

// PATHS

const xml_file2 = `.${info.folder}/apiproxy/proxies/default.xml`;
const xml2 = fs.readFileSync(xml_file2, { encoding: 'utf8', flag: 'r' });
var json_data2 = JSON.parse(parser.xml2json(xml2, {
    compact: true,
    space: 4
}));

result.paths = {};

let obj_arr = (json_data2.ProxyEndpoint.Flows.Flow.length != undefined)? json_data2.ProxyEndpoint.Flows.Flow : json_data2.ProxyEndpoint.Flows;
let counter = 0;
const policies_dir_path = path.join(__dirname, `${info.folder}/apiproxy/policies`);

    for(flow in obj_arr) {
        counter++;
        let item = obj_arr[flow];
        const condition_text = item?.Condition?._text || false;
        const flow_condition = condition_text?condition_text.replaceAll('(', '').replaceAll(')', '').replaceAll('"','').replaceAll('= ','').replaceAll('=',' ').split(' '):false;
        let path_suffix = flow_condition?flow_condition[flow_condition.indexOf('MatchesPath')+1].toString():'';
        const http_verb = flow_condition?flow_condition[flow_condition.indexOf('request.verb')+1].toString():'';
        const description = item._attributes.name;
        const descrip = item?.Description?._text || 'No available description';

        const proxy_suffix_name = description.replaceAll(' ', '');

        let temp_xml_file = '';

        const filenames = fs.readdirSync(policies_dir_path);

        for(policy in filenames) {
            const file = filenames[policy];
            // we keep just the last portion after a "-" being this the name match for the cond flow
            // let's compare also for the first portion to be an EV policy
            const nm_file = file.split('.')[0].split('-')[file.split('.')[0].split('-').length - 1];
            const policy_type = file.split('.')[0].split('-')[0];// EV or AM or JS ...
            if(nm_file == proxy_suffix_name && policy_type.toUpperCase() == 'EV') {
                temp_xml_file = file;
                break;
            }
        }


        let arr_payload_props = {};
        let arr_payload_example = {};

        if(temp_xml_file != '') {
            const xml_policy_dir = `.${info.folder}/apiproxy/policies/${temp_xml_file}`;
            const xml_policy = fs.readFileSync(xml_policy_dir, { encoding: 'utf8', flag: 'r' });
            var json_policy = JSON.parse(parser.xml2json(xml_policy, {
                compact: true,
                space: 4
            }));

            const arr_json_vars = json_policy.ExtractVariables.JSONPayload.Variable;
            for(variable in arr_json_vars) {
                const field = arr_json_vars[variable];
                arr_payload_props[field._attributes.name] = {};
                arr_payload_props[field._attributes.name].type = "string";

                // examples...
                arr_payload_example[field._attributes.name] = "";
            }
        }

        path_suffix = json_data.APIProxy.BasePaths._text+path_suffix;

        const tag_arr_flow = product_name;
        
        params_arr = [];

        params_arr.push({
            name: "apikey",
            in: "header",
            required: true,
            schema: {
                externalDocs: {
                    url: ""
                },
                type: "string"
            }
        });
        
        let content_conditional = {};
        result.paths[path_suffix] = {};
        // if we have path params
        let path_param = "";
        if(path_suffix.split('{').length > 2) {
            // more than 1 path parameters were found
            const arr_paths =  path_suffix.split('{');
            for(let i = 1; i < arr_paths.length; i++) {
                if(path_suffix.indexOf('}')>-1) {
                    path_param = arr_paths[i].substring(0, arr_paths[i].indexOf('}'));
                    params_arr.push({
                        name: path_param,
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                            example: `{${path_param}}`
                        }
                    });
                }
            }
        }else {
            // only 1 path parameter was found...
            if(path_suffix.indexOf('{')>-1) {
                path_param = path_suffix.substring(path_suffix.indexOf('{')+1, path_suffix.indexOf('}'));
                params_arr.push({
                    name: path_param,
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        example: `{${path_param}}`
                    }
                });
            }
        }

        result.paths[path_suffix][http_verb.toString().toLowerCase()] = {
            tags: [tag_arr_flow],
            parameters: params_arr,
            operationId: description,
            description: descrip,
            responses: {
                "200": {
                    description: "Successful Response",
                },
                "500": {
                    description: "Server Error",
                },
                "404": {
                    description: "Not Found",
                },
                "401": {
                    description: "Not Authorized",
                }
            }
        };
        
        if(http_verb.toString().toLowerCase() == 'post' || http_verb.toString().toLowerCase() == 'put') {
            /* arr_payload_props = {
                key1: {
                    type: "integer"
                },
                key2: {
                    type: "string"
                },
                key3: {
                    type: "boolean"
                }
            }; */
            content_conditional = {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: arr_payload_props
                    }
                }
            };
            content_conditional["application/json"][`Example${counter}`] = {
                description: "",
                value: { ...arr_payload_example },
                summary: `New Example${counter}`
            };

            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody = {};
            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody.content = content_conditional;
            result.paths[path_suffix][http_verb.toString().toLowerCase()].requestBody.description = "";
        }   
    }

// PATHS

result.info = {
    "title": json_data.APIProxy._attributes.name,
    "version": 'rev '+json_data.APIProxy._attributes.revision,
    "description": general_description,
    "x-category": info.category,
    "x-long-description": long_description,
    "x-website": "",
    "x-thumbnail": "https://rapidapi-prod-apis.s3.amazonaws.com/3843db6d-5923-4803-b0f3-58d9e54d8d16.png", 
    "x-public": false,
    "x-version-lifecycle": "active",
    "x-badges": [],
    "x-collections": []
};

result.security = [
    {
      "security_scheme_name": []
    }
];

result.components = {
    "schemas": {},
    "securitySchemes": {
        "security_scheme_name": {
            "x-client-authentication": "BODY",
            "x-scope-separator": "COMMA",
            "type": "oauth2",
            "flows": {
                "clientCredentials": {
                    "tokenUrl": "https://api-test.digital.paccar.cloud/security/oauth2/v1/token",
                    "scopes": {}
                }
            }
        }
    }
}


let arr_servers_host = [];
const config_file = `${info.config}/config.json`;
const data_config_file = JSON.parse(fs.readFileSync(config_file, { encoding: 'utf8', flag: 'r' }));

for(item in data_config_file) {
    let env = data_config_file[item];
    arr_servers_host.push({
        url: env.hostname,
    });
}
result["servers"] = arr_servers_host;

let arr_gateways_host = [];
for(let i = 0; i < arr_servers_host.length; i++) {
    let item = arr_servers_host[i];
    arr_gateways_host.push({
        url: item.url.replaceAll('https://', ''),
    });
}
result["x-gateways"] = arr_gateways_host;
result["x-documentation"] = {
    "tutorials": [],
    "spotlights": []
};


if (info.saveName=="oas_file_v2_"){

    name_of_file = name_of_file.replace('.xml', '');

    if(info.lang == 'json') {
        fs.writeFileSync(`${info.saveFolder}${info.saveName}_${name_of_file}.json`, JSON.stringify(result, null, '\t'));
        console.log('Done!');
    }else {
        const doc = new YAML.Document();
        doc.contents = result;
        fs.writeFileSync(`${info.saveFolder}${info.saveName}_${name_of_file}.yaml`, doc.toString());
        console.log('Done!');
    }

}else {

    name_of_file = name_of_file.replace('.xml', '');

    if(info.lang == 'json') {
        fs.writeFileSync(`${info.saveFolder}${info.saveName}.json`, JSON.stringify(result, null, '\t'));
        console.log('Done!');
    }else {
        const doc = new YAML.Document();
        doc.contents = result;
        fs.writeFileSync(`${info.saveFolder}${info.saveName}.yaml`, doc.toString());
        console.log('Done!');
    }

}


