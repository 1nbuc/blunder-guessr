import { defineConfig } from "vite";
import metablock from "rollup-plugin-userscript-metablock";
import { resolve } from "path";
import fs from "fs";

const metaPath = resolve(__dirname, "./src/meta.js");

export default defineConfig({
	build: {
		outDir: "dist",
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			input: "src/main.js",
			output: {
				dir: "dist",
				entryFileNames: "blunder-guessr.user.js",
				format: "iife",
				banner: fs.readFileSync(metaPath, "utf8"),
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	plugins: [
		{
			name: "dev-server-config",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url === "/blunder-guessr.user.js") {
						try {
							const code = fs.readFileSync(
								"./dist/blunder-guessr.user.js",
								"utf8"
							);
							const meta = fs.readFileSync(metaPath, "utf8");
							res.setHeader(
								"Content-Type",
								"application/javascript"
							);
							res.end(meta + "\n" + code);
						} catch (error) {
							console.error("Error serving userscript:", error);
							res.statusCode = 500;
							res.end(
								"Error building userscript. Please run npm run build first."
							);
						}
						return;
					}
					next();
				});
			},
		},
	],
});
