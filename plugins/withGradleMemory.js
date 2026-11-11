// Plugin de configuration : relève la mémoire allouée à Gradle (évite « build daemon disappeared »
// sur les machines de build EAS de taille standard).
const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults.filter((p) => !(p.type === 'property' && (p.key === 'org.gradle.jvmargs' || p.key === 'org.gradle.workers.max')));
    props.push({ type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx3072m -XX:MaxMetaspaceSize=768m' });
    props.push({ type: 'property', key: 'org.gradle.workers.max', value: '2' });
    cfg.modResults = props;
    return cfg;
  });
};
