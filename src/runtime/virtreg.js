
class KeyNode {

    constructor (name) {
        this.name   = name;
        this.subkeys = [];
        this.values  = {};
    }

    // Get Subkey
    // ==========
    //
    // Searches for `name' in this KeyNode's subkey values.  If `name'
    // matches an existing subkey, that subkey is returned, otherwise
    // `false' is returned.
    //
    get_subkey (name) {

        let subkey = this.subkeys.filter((k) => {
            return k.name.toLowerCase() === name.toLowerCase();
        });

        if (subkey.length) {
            return subkey[0];
        }

        return false;
    }

    // Add Subkey
    // ==========
    //
    add_subkey (name) {

        const subkey = this.get_subkey(name);

        let key_node = new KeyNode(name);
        this.subkeys.push(key_node);
        return key_node;
    }

    // Get Value
    // =========
    //
    // Attempts to return the value associated with `key'.
    //
    get_value (key) {
        const value = this.values[key.toLowerCase()];
        return value;
    }

    // Add Value
    // =========
    //
    // Associates `key` with `value' in this KeyNode's value store.
    // If `key' is the empty string ("") then this is interpreted to
    // mean "the default value".
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

    get_vreg () {
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
            throw new Error("Invalid root: " + root);
        }

        return {
            orig:    path,
            lowered: path_parsed.map(p => p.toLowerCase()),
            root:    root.toUpperCase()
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
              key_node    = this.get_key(parsed_path, subkey);

        return key_node.get_value(subkey);
    }

    // Write
    // =====
    //
    // Given a `path' and a `value', #Write attempts to add a
    // key=>value mapping, where the key is the last part of the
    // `path' string.
    //
    write (path, value) {

        const parsed_path = this.parse_path(path),
              subkey      = parsed_path.lowered.pop(),
              root        = this.mkpathp(parsed_path);

        root.add_value(subkey, value);
    }

    delete (path) {

    }

    get_key (parsed_path, value_key) {

        let root = this.reg[parsed_path.root],
            path = parsed_path.lowered;

        return (function walk (p, root) {

            if (root.get_subkey === undefined) {
                throw new Error(`Unable to open registry key - path not found: ${parsed_path.orig}`);
            }

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

            const subkey_name = p.shift(),
                  key         = root.get_subkey(subkey_name);

            if (key === false) {
                root = root.add_subkey(subkey_name);
            }
            else {
                root = key;
            }

            return walk(p, root);
        }(path, root));
    }
}

module.exports = VirtualRegistry;
