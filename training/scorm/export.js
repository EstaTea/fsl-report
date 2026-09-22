/* ============================================================================
   SCORM / cmi5 课程包导出（零依赖，不引任何 CDN）
   - 生成三种包：SCORM 1.2 / SCORM 2004(4th, 含 <imsss:sequencing>) / cmi5
   - zip 采用 STORE（不压缩）方式自实现，配合 UTF-8 文件名标志位
   - 包内结构：index.html(入口外壳) + overlay-run.html + courses/{id}.json
                + stage/*.html + screens/*.json + 清单文件
   导出后可直接导入任意第三方 LMS（Moodle / Cornerstone / SumTotal 等）。
   ========================================================================== */
(function () {
  'use strict';
  var HOME = 'https://estatea.github.io/fsl-report/training/';

  /* ── 最小 ZIP 写入器（STORE + CRC32）───────────────────────────── */
  var CRC_TABLE = (function () {
    var t = [], c, i, j;
    for (i = 0; i < 256; i++) {
      c = i;
      for (j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(files) {
    var parts = [], central = [], offset = 0;
    var enc = new TextEncoder();

    function dosTime(d) {
      return ((d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2))) & 0xFFFF;
    }
    function dosDate(d) {
      return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    }
    var now = new Date(), tm = dosTime(now), dt = dosDate(now);

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var data = f.data;
      var crc = crc32(data);

      var local = new Uint8Array(30 + nameBytes.length);
      var dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);        // version needed
      dv.setUint16(6, 0x0800, true);    // UTF-8 文件名标志位
      dv.setUint16(8, 0, true);         // STORE
      dv.setUint16(10, tm, true);
      dv.setUint16(12, dt, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true);
      local.set(nameBytes, 30);

      parts.push(local, data);

      var cd = new Uint8Array(46 + nameBytes.length);
      var cdv = new DataView(cd.buffer);
      cdv.setUint32(0, 0x02014b50, true);
      cdv.setUint16(4, 20, true);
      cdv.setUint16(6, 20, true);
      cdv.setUint16(8, 0x0800, true);
      cdv.setUint16(10, 0, true);
      cdv.setUint16(12, tm, true);
      cdv.setUint16(14, dt, true);
      cdv.setUint32(16, crc, true);
      cdv.setUint32(20, data.length, true);
      cdv.setUint32(24, data.length, true);
      cdv.setUint16(28, nameBytes.length, true);
      cdv.setUint32(38, 0, true);
      cdv.setUint32(42, offset, true);
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += local.length + data.length;
    });

    var cdSize = central.reduce(function (n, c) { return n + c.length; }, 0);
    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);

    return new Blob(parts.concat(central, [eocd]), { type: 'application/zip' });
  }

  /* ── 清单生成 ─────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function indexShell(courseId) {
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>ERP 仿真培训课程</title>\n' +
      '<style>html,body{margin:0;padding:0;height:100%;}iframe{width:100%;height:100%;border:0;display:block;}</style>\n' +
      '</head>\n<body>\n<iframe src="overlay-run.html?course=' + esc(courseId) + '" title="课程"></iframe>\n</body>\n</html>\n';
  }
  function fileTags(list) {
    return list.map(function (f) { return '    <file href="' + esc(f) + '" />'; }).join('\n');
  }

  function manifest12(course, files) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<manifest identifier="FSL_' + esc(course.id) + '_MANIFEST" version="1.2"\n' +
      '  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"\n' +
      '  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"\n' +
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
      '  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd ' +
      'http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">\n' +
      '  <metadata>\n    <schema>ADL SCORM</schema>\n    <schemaversion>1.2</schemaversion>\n' +
      '    <title>' + esc(course.title) + '</title>\n  </metadata>\n' +
      '  <organizations default="FSL_ORG">\n' +
      '    <organization identifier="FSL_ORG">\n      <title>' + esc(course.title) + '</title>\n' +
      '      <item identifier="ITEM_1" identifierref="RES_1" isvisible="true">\n' +
      '        <title>' + esc(course.title) + '</title>\n' +
      '        <adlcp:masteryscore>60</adlcp:masteryscore>\n' +
      '        <adlcp:maxtimeallowed>' + esc(course.duration || '') + '</adlcp:maxtimeallowed>\n' +
      '        <adlcp:datafromlms>FSL Training</adlcp:datafromlms>\n' +
      '      </item>\n    </organization>\n  </organizations>\n' +
      '  <resources>\n    <resource identifier="RES_1" type="webcontent" adlcp:scormtype="sco" href="index.html">\n' +
      fileTags(files) + '\n    </resource>\n  </resources>\n</manifest>\n';
  }

  function manifest2004(course, files) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<manifest identifier="FSL_' + esc(course.id) + '_MANIFEST" version="1.3"\n' +
      '  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"\n' +
      '  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"\n' +
      '  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"\n' +
      '  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"\n' +
      '  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"\n' +
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
      '  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd ' +
      'http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd ' +
      'http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd ' +
      'http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">\n' +
      '  <metadata>\n    <schema>ADL SCORM</schema>\n    <schemaversion>2004 4th Edition</schemaversion>\n' +
      '    <adlcp:location>' + esc(HOME) + '#/course/' + esc(course.id) + '</adlcp:location>\n' +
      '    <title>' + esc(course.title) + '</title>\n  </metadata>\n' +
      '  <organizations default="FSL_ORG">\n    <organization identifier="FSL_ORG">\n' +
      '      <title>' + esc(course.title) + '</title>\n' +
      '      <item identifier="ITEM_1" identifierref="RES_1" isvisible="true">\n' +
      '        <title>' + esc(course.title) + '</title>\n' +
      '        <adcp:timeLimitAction xmlns:adcp="http://www.adlnet.org/xsd/adlcp_v1p3">continue,no message</adcp:timeLimitAction>\n' +
      '        <adlcp:completionThreshold>0.8</adlcp:completionThreshold>\n' +
      '        <imsss:sequencing>\n' +
      '          <imsss:controlMode choice="true" choiceExit="true" flow="true" forwardOnly="false" useCurrentAttemptObjectiveInfo="true" useCurrentAttemptProgressInfo="true" />\n' +
      '          <imsss:sequencingRules />\n' +
      '          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" tracked="true" />\n' +
      '          <imsss:objectives>\n' +
      '            <imsss:primaryObjective objectiveID="FSL_PRIMARY_OBJ" satisfiedByMeasure="true">\n' +
      '              <imsss:minNormalizedMeasure>0.6</imsss:minNormalizedMeasure>\n' +
      '            </imsss:primaryObjective>\n' +
      '          </imsss:objectives>\n' +
      '        </imsss:sequencing>\n' +
      '      </item>\n    </organization>\n  </organizations>\n' +
      '  <resources>\n    <resource identifier="RES_1" type="webcontent" adlcp:scormType="sco" href="index.html">\n' +
      fileTags(files) + '\n    </resource>\n  </resources>\n</manifest>\n';
  }

  function cmi5Xml(course) {
    var base = HOME + '#/course/' + course.id;
    var auId = base + '/au/1';
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<courseStructure xmlns="https://w3id.org/xapi/profiles/cmi5/v1.0/CourseStructure">\n' +
      '  <course id="' + esc(base) + '">\n' +
      '    <title><langstring lang="zh-CN">' + esc(course.title) + '</langstring></title>\n' +
      '    <description><langstring lang="zh-CN">' + esc(course.desc || '') + '</langstring></description>\n' +
      '  </course>\n' +
      '  <block id="' + esc(base) + '/block/1">\n' +
      '    <title><langstring lang="zh-CN">操作引导</langstring></title>\n' +
      '    <au id="' + esc(auId) + '" moveOn="Completed" masteryScore="0.6">\n' +
      '      <title><langstring lang="zh-CN">' + esc(course.title) + '</langstring></title>\n' +
      '      <url>index.html</url>\n' +
      '      <description><langstring lang="zh-CN">' + esc(course.desc || '') + '</langstring></description>\n' +
      '      <activityType>https://w3id.org/xapi/cmi5/activitytype/course</activityType>\n' +
      '    </au>\n  </block>\n</courseStructure>\n';
  }

  /* ── 根据课程推导需要打包的文件 ───────────────────────────────── */
  function contentFiles(course) {
    var list = ['index.html', 'overlay-run.html', 'courses/' + course.id + '.json'];
    var stage = course.stage || 'stage/po-create.html';
    var m = /stage\/screen\.html\?screen=([^&]+)/.exec(stage);
    if (m) {
      list.push('stage/screen.html', 'screens/' + m[1] + '.json');
    } else {
      list.push(stage);
    }
    return list;
  }

  function fetchBytes(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(function (b) { return new Uint8Array(b); });
  }

  function api() {
    return {
      zip: zip,
      crc32: crc32,
      contentFiles: contentFiles,
      manifest12: manifest12,
      manifest2004: manifest2004,
      cmi5Xml: cmi5Xml,
      indexShell: indexShell,

      /* 构建课程包：kind = '12' | '2004' | 'cmi5' */
      build: function (course, kind) {
        var files = contentFiles(course);
        var enc = new TextEncoder();
        var out = [];
        return Promise.all(files.map(function (name) {
          if (name === 'index.html') return Promise.resolve({ name: name, data: enc.encode(indexShell(course.id)) });
          return fetchBytes(name).then(function (d) { return { name: name, data: d }; });
        })).then(function (items) {
          var names = items.map(function (i) { return i.name; });
          var manifestName, manifestText;
          if (kind === 'cmi5') { manifestName = 'cmi5.xml'; manifestText = cmi5Xml(course); }
          else if (kind === '2004') { manifestName = 'imsmanifest.xml'; manifestText = manifest2004(course, names); }
          else { manifestName = 'imsmanifest.xml'; manifestText = manifest12(course, names); }
          out = items.concat([{ name: manifestName, data: enc.encode(manifestText) }]);
          return { files: names.concat([manifestName]), blob: zip(out), manifest: manifestText, kind: kind };
        });
      },

      download: function (course, kind) {
        return this.build(course, kind).then(function (res) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(res.blob);
          a.download = course.id + '-' + kind + '.zip';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          return res;
        });
      }
    };
  }

  window.FSL_EXPORT = api();
})();
