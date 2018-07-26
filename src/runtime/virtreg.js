
class KeyNode {

    constructor (name) {
        this.name   = name;
        this.subkeys = [];
        this.values  = {};
    }

    get_subkey (name) {

        let subkey = this.subkeys.filter((k) => {
            return k.name.toLowerCase() === name.toLowerCase();
        });

        if (subkey.length) {
            return subkey[0];
        }

        return false;
    }

    add_subkey (name) {

        const subkey = this.get_subkey(name);

        let key_node = new KeyNode(name);
        this.subkeys.push(key_node);
        return key_node;
    }

    get_value (key) {
        const value = this.values[key.toLowerCase()];
        return value;
    }

    add_value (key, value) {

        const existing_key = Object.keys(this.values).filter(
            k => k.toLowerCase === key.toLowerCase()
        ).pop();

        if (existing_key) {
            delete this.values[existing_key];
        }

        this.values[key] = value;
    }
}


class VirtualRegistry {

    constructor (context) {
        this.context = context;

        this.reg = {
            HKEY_CURRENT_USER:  new KeyNode("HKEY_CURRENT_USER"),
            HKEY_LOCAL_MACHINE: new KeyNode("HKEY_LOCAL_MACHINE"),
            HKEY_CLASSES_ROOT:  new KeyNode("HKEY_CLASSES_ROOT")
        };
    }


    // [private] parse_path
    // ====================
    //
    // Given a string, attempts to parse the path as if it were a
    // registry value.
    //
    parse_path (path) {

        if (Array.isArray(path)) return path;

        let path_parsed = path.split("\\"),
            root = path_parsed.shift();

        switch (root.toUpperCase()) {
        case "HKLM":
            root = "HKEY_LOCAL_MACHINE";
            break;
        case "HKCU":
            root = "HKEY_CURRENT_USER";
            break;
        case "HKCR":
            root = "HKEY_CLASSES_ROOT";
            break;
        case "HKEY_LOCAL_MACHINE":
        case "HKEY_CURRENT_USER":
        case "HKEY_CLASSES_ROOT":
            break;
        default:
            return false;
        }

        return {
            orig:    path_parsed,
            lowered: path_parsed.map(p => p.toLowerCase()),
            root:    root
        };
    }

    // Read
    // ====
    //
    // Given a path to a registry entry, attempts to return the
    // associated registry value.  If the path ends in a backslash,
    // `Read' returns the key's default value, else it reads the named
    // value.
    //
    read (path) {

        const parsed_path = this.parse_path(path),
              subkey      = parsed_path.lowered.pop(),
              key_node    = this.get_key(parsed_path);

        return key_node.get_value(subkey);
    }

    write (path, value) {

        const parsed_path = this.parse_path(path),
              subkey      = parsed_path.lowered.pop(),
              root        = this.mkpathp(parsed_path);

        root.add_value(subkey, value);
    }

    delete (path) {

    }

    get_key (parsed_path) {

        let root = this.reg[parsed_path.root],
            path = parsed_path.lowered;

        return (function walk (p, root) {

            if (p.length === 0) return root;

            const key = p.shift();

            root = root.get_subkey(key);

            return walk(p, root);
        }(path, root));
    }

    mkpathp (parsed_path) {

        let root = this.reg[parsed_path.root],
            path = parsed_path.lowered;

        return (function walk (p, root) {

            if (p.length === 0) return root;

            const key = p.shift();
            root = root.add_subkey(key);

            return walk(p, root);
        }(path, root));
    }
}

module.exports = VirtualRegistry;
