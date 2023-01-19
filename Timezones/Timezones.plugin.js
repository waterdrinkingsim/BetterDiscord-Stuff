/**
 * @name Timezones
 * @author TheCommieAxolotl#0001
 * @description Allows you to display other Users' local times.
 * @version 1.0.0
 * @authorId 538487970408300544
 * @invite 5BSWtSM3XU
 * @source https://github.com/TheCommieAxolotl/BetterDiscord-Stuff/tree/main/Timezones
 * @updateurl https://raw.githubusercontent.com/TheCommieAxolotl/BetterDiscord-Stuff/main/Timezones/Timezones.plugin.js
 * @donate https://github.com/sponsors/thecommieaxolotl
 */

module.exports = (() => {
    const config = {
        info: {
            name: "Timezones",
            authors: [
                {
                    name: "TheCommieAxolotl",
                    discord_id: "538487970408300544",
                },
            ],
            github_raw: "https://raw.githubusercontent.com/TheCommieAxolotl/BetterDiscord-Stuff/main/Timezones/Timezones.plugin.js",
            version: "1.0.0",
            description: "Allows you to display other Users' local times.",
        },
    };

    return !global.ZeresPluginLibrary
        ? class {
              constructor() {
                  this._config = config;
              }
              getName() {
                  return config.info.name;
              }
              getAuthor() {
                  return config.info.authors.map((a) => a.name).join(", ");
              }
              getDescription() {
                  return config.info.description;
              }
              getVersion() {
                  return config.info.version;
              }
              load() {
                  BdApi.showConfirmationModal("Library Missing", `The library plugin needed for **${config.info.name}** is missing. Please click Download Now to install it.`, {
                      confirmText: "Download Now",
                      cancelText: "Cancel",
                      onConfirm: () => {
                          require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                              if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                              await new Promise((r) => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                          });
                      },
                  });
              }
              start() {}
              stop() {}
          }
        : (([Plugin, Api]) => {
              const plugin = (Plugin, Api) => {
                  const { Patcher } = Api;
                  const { Data, React, injectCSS, clearCSS, Webpack, ContextMenu, UI } = BdApi;

                  const Styles = `
.timezone {
    margin-left: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.375rem;
    color: var(--text-muted);
    vertical-align: baseline;
    display: inline-block;
    height: 1.25rem;
    cursor: default;
    pointer-events: none;
    font-weight: 500;
}

.timezone-margin-top {
    margin-top: 0.5rem;
}

.timezone-banner-container {
    position: relative;
}

.timezone-badge {
    position: absolute;
    bottom: 10px;
    right: 16px;
    background: var(--profile-body-background-color, var(--background-primary));
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    color: var(--text-normal);
}
                  `;

                  return class Timezones extends Plugin {
                      async onStart() {
                          injectCSS("Timezones-Styles", Styles);

                          const ProfileBanner = Webpack.getModule((m) => m.Z?.toString().includes("e.hasBannerImage") && m.Z?.toString().includes("e.hasThemeColors"));
                          const MessageHeader = Webpack.getModule((m) => m.Z?.toString().includes("userOverride") && m.Z?.toString().includes("withMentionPrefix"));
                          const GenericMenu = Webpack.getModule((m) => m.ZP?.toString().includes("menuItemProps:"));

                          ContextMenu.patch("user-context", (ret, props) => {
                              console.log(ret, props);
                              console.log(ret.props.children[0].props.children);

                              ret.props.children[0].props.children.push([
                                  ContextMenu.buildItem({ type: "separator" }),
                                  ContextMenu.buildItem({
                                      label: "Set Timezone",
                                      action: () => {
                                          return this.setTimezone(props.user.id, props.user);
                                      },
                                  }),
                              ]);
                          });
                          Patcher.after(ProfileBanner, "Z", (_, [props], ret) => {
                              const originalRet = { ...ret };

                              if (!this.hasTimezone(props.user.id)) return;

                              ret.type = "div";
                              ret.props = {
                                  className: "timezone-banner-container",
                                  children: [originalRet, React.createElement("div", { className: "timezone-badge" }, this.getLocalTime(props.user.id))],
                              };
                          });

                          Patcher.after(MessageHeader, "Z", (_, [props], ret) => {
                              this.hasTimezone(props.message.author.id) &&
                                  ret.props.children.push(React.createElement("span", { className: "timezone" }, this.getLocalTime(props.message.author.id, props.message.timestamp._d)));
                          });
                      }

                      hasTimezone(id) {
                          return !!Data.load(config.info.name, id);
                      }

                      setTimezone(id, user) {
                          let hours = 0;
                          let minutes = 0;

                          const TextInput = Webpack.getModule((m) => m.ZP?.prototype?.render?.toString().includes("inputClassName") && m.ZP?.prototype?.render?.toString().includes("inputPrefix")).ZP;
                          const Markdown = Webpack.getModule((m) => m.Z?.rules && m.Z?.defaultProps?.parser).Z;

                          UI.showConfirmationModal(
                              "Set Timezone",
                              [
                                  React.createElement(Markdown, null, "Please enter an hour offset between -12 and 12 (UTC)"),
                                  React.createElement(TextInput, {
                                      type: "number",
                                      maxLength: "2",
                                      placeholder: "0",
                                      onChange: (v) => {
                                          hours = v;
                                      },
                                  }),
                                  React.createElement(Markdown, { className: "timezone-margin-top" }, "Please enter a minute offset between 0 and 60 (UTC)"),
                                  React.createElement(TextInput, {
                                      type: "number",
                                      maxLength: "2",
                                      placeholder: "0",
                                      onChange: (v) => {
                                          minutes = v;
                                      },
                                  }),
                              ],
                              {
                                  confirmText: "Set",
                                  onConfirm: () => {
                                      Data.save(config.info.name, id, [hours, minutes]);

                                      BdApi.showToast(`Timezone set to UTC${hours > 0 ? `+${hours}` : hours}${minutes ? `:${minutes}` : ""} for ${user.username}`, {
                                          type: "success",
                                      });
                                  },
                              }
                          );
                      }

                      getLocalTime(id, time) {
                          const timezone = Data.load(config.info.name, id);

                          if (!timezone) return null;

                          let hours;
                          let minutes;

                          if (time) {
                              hours = time.getUTCHours() + Number(timezone[0]);
                              minutes = time.getUTCMinutes() + Number(timezone[1]);
                          } else {
                              hours = new Date().getUTCHours() + Number(timezone[0]);
                              minutes = new Date().getUTCMinutes() + Number(timezone[1]);
                          }

                          const hour = hours % 12 || 12;
                          const ampm = hours < 12 ? "AM" : "PM";

                          return `${hour}:${minutes.toString().length === 1 ? `0${minutes}` : minutes} ${ampm}`;
                      }

                      onStop() {
                          Patcher.unpatchAll();
                          clearCSS("Timezones-Styles");
                      }
                  };
              };

              return plugin(Plugin, Api);
          })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
