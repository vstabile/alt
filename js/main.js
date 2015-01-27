jQuery(function($, undefined) {
  const VERSION_ = "0.0.1";
  const CMDS_ = [
    'cat', 'cd', 'clear', 'date', 'help', 'ls', 'pwd', 'version', 'whoami'
  ];
  const README_ = '\
      -----------------------------------\n\
      ------------ ALT GROUP ------------\n\
      -----------------------------------\n\n\
      Some description here.\n\n'

  var host_ = "ALT";

  var username_ = "anon";

  var cwd_ = "/"

  var fs_ = {
    "README.txt": README_,
    file0: "Lorem ipsum",
    dir1: {
      file1: "#1 AI Revolution\n\nDescrição do primeiro encontro.",
      dir12: {
        file12: "Another file"
      }
    }
  }

  $('#terminal').terminal({
    version: function () {
      this.echo(VERSION_);
    },
    help: function () {
      this.echo("Commands available: " + CMDS_.join(', '));
    },
    whoami: function () {
      this.echo(username_);
    },
    date: function () {
      this.echo((new Date()).toLocaleString());
    },
    clear: function () {
      this.clear();
    },
    pwd: function () {
      this.echo(cwd_);
    },
    ls: function () {
      list = ls_();
      for (key in list) {
        if (list[key] == "string")
          this.echo("<span class='file'>" + key + "</span>", { raw: true });
        else
          this.echo("<span class='dir'>" + key + "</span>", { raw: true });
      }
    },
    cd: function(path) {
      absolute_path = absolute_path_(path);
      cwd_ = absolute_path;
      this.set_prompt(prompt_());
    },
    cat: function (filename) {
      try {
        object = path_to_object_(filename);
        if (typeof object == "string")
          this.echo(object);
        else
          this.error("cat: " + filename + ": Is a directory")
      } catch (e) {
        this.error("cat: " + filename + ": No such file or directory");
      }
    }
  }, {
    greetings: prompt_() + "cat README.txt\n\n" + README_,
    name: 'alt',
    height: "100%",
    width: "100%",
    prompt: prompt_(),
    processArguments: function(string) {
      var command_re = /('[^']*'|"(\\"|[^"])*"|(\\ |[^ ])+|[\w-]+)/g;
      return $.map(string.match(command_re) || [], function(arg) {
        if (arg[0] === "'" && arg[arg.length-1] === "'") {
          return arg.replace(/^'|'$/g, '');
        } else if (arg[0] === '"' && arg[arg.length-1] === '"') {
          return arg.replace(/^"|"$/g, '').replace(/\\([" ])/g, '$1');
        } else if (arg[0] === '/' && arg[arg.length-1] == '/') {
          return arg;
        } else {
          return arg.replace(/\\ /g, ' ');
        }
      });
    }
  });

  function absolute_path_ (path) {
    // Remove leading "./"
    path = path.replace(/^\.\//, "");
    // If relative path, merge path with current directory
    if (path[0] != "/") path = cwd_.replace(/\/$/, "") + "/" + path;
    // Remove leading and trailing "/"
    path = path.replace(/^\/|\/$/g, "");
    var dirs = path.split("/");
    // Leave dirs array empty if root path "/"
    if (dirs[0] == "") dirs = dirs.slice(1);
    // Remove all ".."
    while (dirs.indexOf("..") != -1) {
      i = dirs.indexOf("..");
      dirs.splice(i - 1, 2)
    }
    var fs = fs_
    var dirsLength = dirs.length;
    for (var i = 0; i < dirsLength; i++) {
      dir = dirs[i];
      fs = fs[dir]
      if (fs == undefined) {
        this.error("bash: cd: " + path + ": No such file or directory")
        return;
      }
    }
    return "/" + dirs.join("/");
  }

  function path_to_object_ (path) {
    absolute_path = absolute_path_(path);
    var dirs = absolute_path.split("/");
    // Leave dirs array empty if root path "/"
    if (dirs[0] == "") dirs = dirs.slice(1);
    var fs = fs_;
    var dirsLength = dirs.length;
    for (var i = 0; i < dirsLength; i++) {
      dir = dirs[i];
      fs = fs[dir];
      if (fs == undefined) {
        this.error("bash: cd: " + path + ": No such file or directory")
        return;
      }
    }
    return fs;
  }

  function ls_ () {
    list = {}
    var dirs = cwd_.split("/");
    if (dirs[0] == '.' || dirs[0] == '') {
      dirs = dirs.slice(1);
    }
    if (dirs[dirs.length - 1] == '') {
      dirs = dirs.slice(0, dirs.length - 1)
    }
    var fs = fs_;
    var dirsLength = dirs.length;
    for (var i = 0; i < dirsLength; i++) {
      dir = dirs[i];
      fs = fs[dir]
      if (fs == undefined) {
        this.error("bash: cd: " + path + ": No such file or directory")
        return;
      }
    }
    for (key in fs) {
      list[key] = typeof fs[key]
    }
    console.log(list)
    return list//.join('\n')
  }

  function prompt_ (cwd) {
    return username_ + '@' + host_ + ':' + cwd_ + '$ ';
  }
});