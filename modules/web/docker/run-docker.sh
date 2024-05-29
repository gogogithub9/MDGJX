# Last Updated: 2024/03/09
#!/bin/bash

source /home/appuser/Server2App-dist/env.sh

containerName=$1
crtVersion=$2
listenPort=$3

killCP(){
    pContainerName=$1
    pListenPort=$2
    timeout 20 docker ps -a | grep $pContainerName | awk '{print $1}' | xargs -I {} docker stop {}
    timeout 20 docker ps -a | grep $pContainerName | awk '{print $1}' | xargs -I {} docker kill {}
    docker ps -a | grep $pContainerName | awk '{print $1}' | xargs -I {} docker rm {}
}
runCP(){
    pContainerName=$1
    pListenPort=$2
    # 2016 is release, 2017 is beta
    THAT_SVR='http://172.17.0.1:2016'
    if [ "$pContainerName" == "web-beta-inst" ]; then
        THAT_SVR='http://172.17.0.1:2017'
    fi
    docker run -e DIRECT_PROXY_SERVER=$THAT_SVR -e ONLINEMODE=true -e LAFREGION=CN -e APPLANG=zh_CN --name $pContainerName -d -p 0.0.0.0:$pListenPort:39899 codegentoolbox/laftools-linux-x64:$crtVersion
}

# run current
port=$listenPort
killCP $containerName $port
runCP $containerName $port

tryCount=0
while true; do
    tryCount=$((tryCount+1))
    if [ $tryCount -gt 10 ]; then
        echo "Failed to start container $containerName"
        exit 1
    fi
    curl 127.0.0.1:$port -I | grep "200 OK"
    if [ $? -ne 0 ]; then
        echo "Failed to start container $containerName, still waiting"
        sleep 3
        continue
    else
        echo "Container $containerName is running"
        break
    fi
done
exit 0
