module.exports = {
  getConfig(name) {
    try {
      const config = require(`./${name}/config.json`);
      return config;
    } catch (error) {
      return {};
    }
  },
};
