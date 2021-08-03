# frozen_string_literal: true

module JekyllBookshop
  class CommonTag < Jekyll::Tags::IncludeTag
    # Support the bind syntax, spreading an object into params
    def parse_params(context)
      params = super

      params.each do |key, value|
        next unless key == "bind" && value.is_a?(Hash)

        value_hash = {}.merge(value)
        params = value_hash.merge(params)
        next
      end

      params.delete("bind")

      params
    end

    def render_once_found(context, file)
      site = context.registers[:site]
      validate_file_name(file)

      path = locate_include_file(context, file, site.safe)
      return unless path

      add_include_to_dependency(site, path, context)

      partial = load_cached_partial(path, context)

      context.stack do
        context["include"] = parse_params(context) if @params
        begin
          partial.render!(context)
        rescue Liquid::Error => e
          e.template_name = path
          e.markup_context = "included " if e.markup_context.nil?
          raise e
        end
      end
    end
  end
end