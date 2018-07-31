//
// Construct's Virtual Registry
// ============================
//
// The registry is a tree of KeyNodes.
//
//
//   SOFTWARE/                      <-- Key
//   SYSTEM/                        <-- Key
//     +-- ControlSet001/           <-- Sub-key of SYSTEM
//     +-- ControlSet003/           <-- Sub-key of SYSTEM
//     +-- CurrentControlSet/       <-- Sub-key of SYSTEM
//     +-- Select/                  <-- Sub-key of SYSTEM
//         |
//         +-- (Default) => alpha   <-- Value
//         +-- Current   => bravo   <-- Value
//         +-- Foobar    => tango   <-- Value
//
// When a registry path ends with a separator, for example:
//
//   HKLM\SYSTEM\Select\
//
// We interpret this to mean "read the key's default value", which in
// this case would return "alpha".


class KeyNode {

    constructor (name, parent) {
        this.name   = name;
        this.subkeys = [];
        this.values  = {};
        this.parent  = parent; // the parent may be null
    }

    // Get Subkey
    // ==========
    //
    // Attempts to find and return the subkey of the current KeyNode.
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
    // Adds `name' to the set of subkeys for this KeyNode.
    //
    add_subkey (name) {

        const subkey = this.get_subkey(name);

        let key_node = new KeyNode(name, this);
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

    // Delete Value
    // ============
    //
    // Deletes a given registry value.
    delete_value (key) {

    }
}


class VirtualRegistry {

    constructor (context) {
        this.context = context;

        this.reg = {
            HKEY_CURRENT_USER:  new KeyNode("HKEY_CURRENT_USER", null),
            HKEY_LOCAL_MACHINE: new KeyNode("HKEY_LOCAL_MACHINE", null),
            HKEY_CLASSES_ROOT:  new KeyNode("HKEY_CLASSES_ROOT", null)
        };
    }

    get_vreg () {
    }

    resolve_path (path) {

        let split_path = path.split("\\").map(p => p.toLowerCase()),
            root       = split_path.shift();

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

        // There are two types of paths we may be given:
        //
        //   1. HKLM\\System\\foo\\bar
        //   2. HKLM\\System\\foo\\
        //
        // In both cases, the KeyNode we need to fetch is 'bar'.
        //
        let value_label = split_path.pop();

        function get_key (path, root) {

            if (path.length === 0) return root;

            const subkey_name = path.shift();
            root = root.get_subkey(subkey_name);

            return get_key(path, root);
        }

        return {
            key_node: get_key(split_path, this.reg[root])
        };
    }

    // [private] parse_path
    // ====================
    //
    // Given a string, attempts to resolve the registry path and
    // return an object which contains:
    //
    //   - TODO
    //
    parse_path (path) {

        if (Array.isArray(path)) return path;

        let path_parsed = path.split("\\"),
            root        = path_parsed.shift();

        const value_path = !path.endsWith("\\");

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

        /*const parsed_path = this.parse_path(path),
              subkey      = parsed_path.lowered.pop(),
         key_node    = this.get_key(parsed_path, subkey);*/

        let key_node = this.resolve_path(path);



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
        const parsed_path = this.parse_path(path),
              subkey      = parsed_path.lowered.pop(),
              key_node    = this.get_key(parsed_path, subkey);

        if (path.endsWith("\\")) {
            key_node.delete();
        }
        else {
            console.log("delete value", subkey);
            key_node.delete_value("subkey");
        }
    }

    get_key (parsed_path) {

        let root = this.reg[parsed_path.root],
            path = parsed_path.lowered;

        return (function walk (p, root) {

            if (root.get_subkey === undefined) {
                throw new Error(
                    `Unable to open registry key - ` +
                        `path not found: ${parsed_path.orig}`
                );
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
