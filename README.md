# apigee2rapid
Command line tool to generate OAS File from an exported API Proxy bundle from APIGEE X v1.0 <br>
*Custom fields added to publish APIs into Rapid Platform*

![alt text](https://i.ibb.co/G952PpC/apigeerapid.png)


## Installation
After cloning this repo, make sure to run the install command: <br>
```
npm install
```

## Create a config.json File
Use the following structure to add a config file <br>
```
    [
        {
            "name": "Dev",
            "hostname": "https://api-dev.digital.paccar.cloud"
        },
        {
            "name": "Test",
            "hostname": "https://api-test.digital.paccar.cloud"
        },
        {
            "name": "QA",
            "hostname": "https://api-qa.digital.paccar.cloud"
        }
]
```

## Help
Use the following command to see the help/docs: <br>
```
npm run help
```

## Running the CLI Tool
Use the following command to run the cli tool and generate the OAS File: <br>
```
npm run start
```
or
```
npm run start -out=yaml -folder=/apibundles
```

## Author
Alvaro Moreno :octocat: :rocket:
