/*
Surge DNS 脚本：对指定内网域名根据 Wi-Fi SSID 选择 DNS，其余走 DoH

[General]
doh-server = https://your-doh-server/dns-query

[Host]
* = script:dns.js

[Script]
dns.js = type=dns,script-path=dns.js

行为：
- 非内网域名 → 回退到 Surge 默认 DoH
- 内网域名（.byted.org / .bytedance.net / .bytedance.com / .volces.com）：
  - 当 SSID === 'Inspire Creativity'（公司物理内网）时，使用当前网卡下发的系统 DNS
  - 其它网络环境下，使用 127.0.0.1（飞连 CorpLink 本地 stub）
*/

var TARGET_SSID = 'Inspire Creativity';

var hostname = $domain;
var ssid = ($network && $network.wifi && $network.wifi.ssid) || '';
var networkDns = Array.isArray($network.dns) ? $network.dns.filter(Boolean) : [];

var __debugMsg =
    '[dns.js] host=' + hostname +
    ' ssid=' + JSON.stringify(ssid) +
    ' wifi=' + JSON.stringify($network && $network.wifi) +
    ' networkDns=' + JSON.stringify(networkDns);
console.log(__debugMsg);
if (typeof $notification !== 'undefined' && $notification.post) {
    $notification.post('dns.js', hostname, __debugMsg);
}

// 这些内网域名后缀使用系统 DNS 而非 DoH
var domain_suffix = [
    '.byted.org',
    '.bytedance.net',
    '.bytedance.com',
    '.volces.com',
];

// 检查域名是否匹配后缀
var isCorpDomain = false;
for (var i = 0; i < domain_suffix.length; i++) {
    var suffix = domain_suffix[i];
    if (hostname === suffix.substring(1) || hostname.endsWith(suffix)) {
        isCorpDomain = true;
        break;
    }
}

// 不匹配的域名，回退到默认 DoH
if (!isCorpDomain) {
    $done({});
}

var uniqueServers = [];
var seenServers = {};

function appendServer(server) {
    if (!server || seenServers[server]) {
        return;
    }
    seenServers[server] = true;
    uniqueServers.push(server);
}

if (ssid === TARGET_SSID) {
    // 公司物理内网：使用网卡下发的系统 DNS（去掉 loopback，避免命中本机 stub）
    for (var k = 0; k < networkDns.length; k++) {
        var s = networkDns[k];
        if (s !== '127.0.0.1' && s !== '::1') {
            appendServer(s);
        }
    }
} else {
    // 其它网络：使用飞连本地 stub
    appendServer('127.0.0.1');
    appendServer('::1');
}

if (uniqueServers.length > 0) {
    $done({ servers: uniqueServers });
}

// 兜底：列表为空时回退到默认 DoH
$done({});
