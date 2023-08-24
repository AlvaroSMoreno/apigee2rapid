# apigee2rapid
Command line tool to generate OAS File from an exported API Proxy bundle from APIGEE X v1.0 <br>
*Custom fields added to publish APIs into Rapid Platform*

![alt text](https://i.ibb.co/G952PpC/apigeerapid.png)

## Create a env_config.json File
Use the following structure to add a config file <br>
```
    [
        {
            "name": "Development",
            "hostname": "https://api-dev.xxxx.xxxx.xxxx",
            "description": "Dev Server"
        },
        {
            "name": "Stagging",
            "hostname": "https://api-test.xxxx.xxxx.xxxx",
            "description": "Stagging Server"
        },
        {
            "name": "Production",
            "hostname": "https://api-prod.xxxx.xxxx.xxxx",
            "description": "Production Server"
        }
    ]
```

## Author
Alvaro Moreno :octocat: :rocket:
