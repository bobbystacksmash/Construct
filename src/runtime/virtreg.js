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

    // Delete Subkey
    // =============
    //
    // Deletes a subkey where the `subkey.name' matches `name'.
    //
    delete_subkey (name) {
        this.subkeys = this.subkeys.filter(sk => sk.name !== name);
    }

    // Set Subkey
    // ==========
    //
    // Sets `name' to the set of subkeys for this KeyNode.
    //
    set_subkey (name) {
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

    // Set Value
    // =========
    //
    // Associates `key` with `value' in this KeyNode's value store.
    // If `key' is the empty string ("") then this is interpreted to
    // mean "the default value".
    set_value (key, value) {

        const existing_key = Object.keys(this.values).filter(
            k => k.toLowerCase === key.toLowerCase()
        ).pop();

        this.values[key] = value;
    }

    // Delete Value
    // ============
    //
    // Deletes a given registry value.
    delete_value (key) {
        delete this.values[key];
    }
}


class VirtualRegistry {

    constructor (context) {
        this.context = context;

        this.reg = {
            HKEY_CURRENT_USER:  new KeyNode("HKEY_CURRENT_USER",  null),
            HKEY_LOCAL_MACHINE: new KeyNode("HKEY_LOCAL_MACHINE", null),
            HKEY_CLASSES_ROOT:  new KeyNode("HKEY_CLASSES_ROOT",  null),
            HKEY_USERS:         new KeyNode("HKEY_USERS",         null)
        };
    }

    resolve_key (fullpath, options) {

        options = options || {};
        options = Object.assign({ create: false}, options);

        let split_path = fullpath.split("\\"),
            norm_path  = split_path.map(p => p.toLowerCase()),
            orig_path  = {};

        // Windows' registry is case-insensitive, so as part of the
        // path-normalisation process we lowercase the path.  However,
        // when we want to report back to the user, we want to give
        // them the path using the same casing as they gave it to us.
        // This object maps the normalised path part (key) to the
        // original path (value).
        norm_path.forEach((np, i) => orig_path[np] = split_path[i]);

        let root = norm_path.shift().toUpperCase();;
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

        case "HKU":
            root = "HKEY_USERS";
            break;

        case "HKEY_LOCAL_MACHINE":
        case "HKEY_CURRENT_USER":
        case "HKEY_CLASSES_ROOT":
        case "HKEY_USERS":
            break;
        default:
            this.context.exceptions.throw_native_vreg_invalid_root(
                "VirtualRegistry",
                `Top-level registry root key ('${root}') is not defined.`,
                `At its top level, the virtual registry defines routes for ` +
                    `HKLM, HKCU, HKCR, and HKEY_USERS.  The vreg was unable to ` +
                    `successfully resolve the root ('${root}') of the current path: ` +
                    `'${fullpath}'.`
            );
        }

        // There are two types of paths we may be given:
        //
        //   1. HKLM\\System\\foo\\bar
        //   2. HKLM\\System\\foo\\
        //
        // In both cases, the KeyNode we need to fetch or create is
        // 'bar'.
        //
        let value_label  = norm_path.pop(),
            is_root_path = norm_path.length === 0,
            error        = null,
            self         = this;

        function walk (path, key) {

            if (path.length === 0) return key;

            let subkey_label = path.shift(),
                subkey_obj   = key.get_subkey(subkey_label);

            if (subkey_obj === false) {
                if (options.create) {
                    subkey_obj = key.set_subkey(subkey_label);
                }
                else {
                    self.context.exceptions.throw_native_vreg_subkey_not_exists(
                        "VirtualRegistry",
                        `Cannot find subkey '${orig_path[subkey_label]}' in path '${fullpath}'.`,
                        `When attempting to walk the supplied registry path, the key ` +
                            `'${subkey_label}' could not be found.  Consider adding this path ` +
                            `to your Construct config file.`
                    );
                }
            }

            return walk(path, subkey_obj);
        }

        const key = walk(norm_path, this.reg[root]);

        return {
            key:          key,
            path:         fullpath,
            value_label:  value_label,
            is_root_path: is_root_path,
            error:        error,
            get_value:    () => key.get_value(value_label),
            del_value:    () => key.delete_value(value_label)
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
        let resolved = this.resolve_key(path);
        return resolved.get_value();
    }

    // Write
    // =====
    //
    // Given a `path' and a `value', #Write attempts to add a
    // key=>value mapping, where the key is the last part of the
    // `path' string.
    //
    write (path, value) {

        let resolved = this.resolve_key(path, { create: true });

        if (resolved.error) {
            throw new Error(resolved.error);
        }

        // todo - needs work?
        resolved.key.set_value(resolved.value_label, value);
    }

    // Delete
    // ======
    //
    // Given a `path' to delete.  If path ends with a separator (\)
    // then the whole key is deleted, else the value is deleted.
    // Throws if trying to delete either the root key, or a registry
    // key/value which cannot be found.
    //
    delete (path) {

        let resolved = this.resolve_key(path);

        if (resolved.error) {
            throw new Error(`Unable to remove registry key: ${resolved.path}`);
            this.context.exceptions.throw_native_vreg_delete_path_failed(
                `VirtualRegistry`,
                `Unable to delete registry path: '${resolved.path}'.`,
                `The registry path cannot be deleted: '${resolved.path}'.`
            );
        }

        if (resolved.is_root_path) {
            this.context.exceptions.throw_native_vreg_cannot_delete_root_key(
                `VirtualRegistry`,
                `Deleting of top-level (root) keys is not permitted.`,
                `Code attempted to delete a top-level registry key using path ` +
                    `'${path}'.  The top-level (root) keys (such as HKLM, HKCU) cannot ` +
                    `be deleted.`
            );
        }

        if (resolved.value_label === "") {
            // Delete the entire key.
            resolved.key.parent.delete_subkey(resolved.key.name);
        }
        else {
            resolved.del_value();
        }
    }
}

module.exports = VirtualRegistry;
