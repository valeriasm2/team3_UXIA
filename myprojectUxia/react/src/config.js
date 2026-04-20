const config = {
  development: {
    API_URL: "http://localhost:8000/",
    DEBUG: true,
  },
  production: {
    API_URL: "https://uxiaweb3.ieti.site/",
    DEBUG: false,
  },
};

const env = process.env.NODE_ENV || "development";
export default config[env];
