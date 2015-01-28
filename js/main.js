// TODO: refatorar mensagem inicial (chamar cat ao invés de hardcoded)

jQuery(function($, undefined) {
  const VERSION_ = "0.0.1";
  const CMDS_ = [
    'cat', 'cd', 'clear', 'date', 'help', 'ls', 'pwd', 'version', 'whoami', "mkdir", "touch"
  ];
  const README_ = '\
      -----------------------------------\n\
      ------------ ALT GROUP ------------\n\
      -----------------------------------\n\n\
      Some description here.\n\n'

  var host_ = "ALT";

  var user_ = "anon";

  var cwd_ = "/home/anon"

  var fs_ = {
    home: {
      anon: {
        "README.txt": README_,
        file0: "Lorem ipsum",
        dir1: {
          file1: "#1 AI Revolution\n\nDescrição do primeiro encontro.",
          dir12: {
            file12: "Another file"
          }
        },
        emptydir: {}
      }
    }
  }

  $terminal = $('#terminal').terminal({
    version: function () {
      this.echo(VERSION_);
    },
    help: function () {
      this.echo("Commands available: " + CMDS_.join(', '));
    },
    whoami: function () {
      this.echo(user_);
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
    ls: function (path) {
      if (path == undefined) path = ""
      absolute_path = absolute_path_(path);
      var dir = get_from_path_(absolute_path);
      if (typeof dir == "object") {
        for (key in dir) {
          if (typeof(dir[key]) == "string")
            this.echo("<span class='file'>" + key + "</span>", { raw: true });
          else
            this.echo("<span class='dir'>" + key + "</span>", { raw: true });
        }
      } else if (typeof dir == "string") {
        this.echo(path);
      } else {
        this.echo("ls: cannot access " + path + ": No such file or directory")
      }
    },
    cd: function(path) {
      if (path == undefined) path = home_()
      absolute_path = absolute_path_(path);
      dest = get_from_path_(absolute_path);
      if (typeof dest == "object") {
        cwd_ = absolute_path;
        this.set_prompt(prompt_());
      } else if (typeof dest == "string") {
        this.error("bash: cd: test: Not a directory")
      } else {
        this.error("bash: cd: " + path + ": No such file or directory")
      }
    },
    cat: function (path) {
      if (path == undefined) return;
      absolute_path = absolute_path_(path)
      file = get_from_path_(absolute_path);
      if (typeof file == "string")
        this.echo(file);
      else if (typeof file == "object")
          this.error("cat: " + path + ": Is a directory")
      else
        this.error("cat: " + path + ": No such file or directory");
    },
    mkdir: function(path) {
      absolute_path = absolute_path_(path);
      newdir = get_from_path_(absolute_path);
      if (newdir != undefined) {
        this.error("mkdir: cannot create directory '" + path + "': File exists")
        return
      }
      parentdir = get_from_path_(parent_(absolute_path));
      if (parentdir == undefined) {
        this.error("mkdir: cannot create directory '" + path + "': No such file or directory")
        return
      }
      set_to_path_(absolute_path, {});
    },
    touch: function(path) {
      absolute_path = absolute_path_(path);
      dest = get_from_path_(absolute_path);
      if (dest == undefined) set_to_path_(absolute_path, "");
    },
    rm: function(flag, path) {
      if (path == undefined) path = flag;
      if (path == undefined) { 
        this.error("rm: missing operand");
        return;
      }
      absolute_path = absolute_path_(path);
      target = get_from_path_(absolute_path);
      if (typeof target == "string") {
        remove_from_path_(absolute_path);
      } else if (typeof target == "object") {
        if (flag.toLowerCase() == "-r")
          remove_from_path_(absolute_path);
        else
          this.error("rm: cannot remove '" + path + "': Is a directory")
      } else {
        this.error("rm: cannot remove '" + path + "': No such file or directory")
      }
    }
  }, {
    greetings: prompt_() + "cat README.txt\n\n" + README_,
    name: 'alt',
    height: "100%",
    width: "100%",
    checkArity: false,
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

  function prompt_ (cwd) {
    var cwd = cwd_.replace(RegExp("^\\/home\\/" + user_), "~")
    return user_ + '@' + host_ + ':' + cwd + '$ ';
  }

  function home_ () {
    return "/home/" + user_
  }

  function parent_(path) {
    var path = path.replace(/\/$/, "");
    return path.substring(0, path.lastIndexOf("/"));
  }

  function path_to_array_(path) {
    var dirs = path.split("/");
    while (dirs.indexOf("") != -1) {
      i = dirs.indexOf("");
      dirs.splice(i, 1)
    }
    return dirs
  }

  function absolute_path_ (path) {
    // Remove leading "./"
    path = path.replace(/^\.\//, "");
    // Replace leading "~"
    path = path.replace(/^\~/, home_());
    // If relative path, merge path with current directory
    if (path[0] != "/") path = cwd_.replace(/\/$/, "") + "/" + path;
    // Convert path to array of diretories
    var dirs = path_to_array_(path);
    // Remove all ".."
    while (dirs.indexOf("..") != -1) {
      i = dirs.indexOf("..");
      dirs.splice(i - 1, 2)
    }
    return "/" + dirs.join("/");
  }

  function get_from_path_(path) {
    var fs = fs_;
    var dirs = path_to_array_(path);
    var len = dirs.length;
    for(var i = 0; i < len-1; i++) {
        var elem = dirs[i];
        if(!fs[elem]) return undefined;
        fs = fs[elem];
    }

    return fs[dirs[len-1]];
  }

  function set_to_path_(path, value) {
    var fs = fs_;
    var dirs = path_to_array_(path);
    var len = dirs.length;
    for(var i = 0; i < len-1; i++) {
      var elem = dirs[i];
      if(!fs[elem]) fs[elem] = {}
      fs = fs[elem];
    }

    fs[dirs[len-1]] = value;
  }

  function remove_from_path_(path) {
    var fs = fs_;
    var dirs = path_to_array_(path);
    var len = dirs.length;
    for(var i = 0; i < len-1; i++) {
      var elem = dirs[i];
      if(!fs[elem]) fs[elem] = {}
      fs = fs[elem];
    }

    delete fs[dirs[len-1]];
  }
});