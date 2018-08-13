const Component    = require("../Component"),
      proxify      = require("../proxify2");


class JS_WshRemote extends Component {

    constructor (context) {
        super(context, "WshRemote");
    }
}

module.exports = function create(context) {
    let remote = new JS_WshRemote(context);
    return proxify(controller);
};
