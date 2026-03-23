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

// 这些内网域名后缀使用系统 DNS 而非 DoH
var domain_suffix = [
    '.byted.org',
    '.bytedance.net',
    '.bytedance.com',
    '.volces.com',
];

// 检查域名是否匹配后缀
for (var i = 0; i < domain_suffix.length; i++) {
    var suffix = domain_suffix[i];
    if (hostname === suffix.substring(1) || hostname.endsWith(suffix)) {
        $done({ servers: ["127.0.0.1"] });
    }
}

// 不匹配的域名使用默认 DoH
$done({});
