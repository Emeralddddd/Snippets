/*
Surge DNS 脚本：对指定内网域名使用系统下发的 DNS，其余走 DoH

[General]
doh-server = https://your-doh-server/dns-query

[Host]
* = script:dns.js

[Script]
dns.js = type=dns,script-path=dns.js
*/

var hostname = $domain;
var networkDns = Array.isArray($network.dns) ? $network.dns.filter(Boolean) : [];
var preferredDns = ['127.0.0.1', '::1'];

var uniqueServers = [];
var seenServers = {};

function appendServer(server) {
    if (!server || seenServers[server]) {
        return;
    }
    seenServers[server] = true;
    uniqueServers.push(server);
}

for (var j = 0; j < preferredDns.length; j++) {
    appendServer(preferredDns[j]);
}

for (var k = 0; k < networkDns.length; k++) {
    appendServer(networkDns[k]);
}

// 这些内网域名后缀使用系统 DNS 而非 DoH
var domain_suffix = [
    '.byted.org',
    '.bytedance.net',
    '.bytedance.com',
    '.volces.com',
];

// 内网域名优先走飞连本地 stub 和当前网络接口下发的 DNS。
var useNetworkDns = false;

// 检查域名是否匹配后缀
for (var i = 0; i < domain_suffix.length; i++) {
    var suffix = domain_suffix[i];
    if (hostname === suffix.substring(1) || hostname.endsWith(suffix)) {
        useNetworkDns = true;
        break;
    }
}

if (useNetworkDns && uniqueServers.length > 0) {
    $done({ servers: uniqueServers });
}

// 不匹配的域名，或当前网络未下发 DNS 时，回退到默认 DoH
$done({});
