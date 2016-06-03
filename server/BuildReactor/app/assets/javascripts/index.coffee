

@getProgress =  ->
  $.get "/progress", (progres) ->
    $("#status").text("Build started...#{progres}");

$ ->
  $.get "/profiles", (profiles) ->
    $.each profiles, (index, item) ->
      selected = if item.uuid == '2848f246-b7d5-4168-801d-8393efb92221' then "selected='true'" else ""
      $("#p-profile").append "<option " + selected + " value='#{item.uuid}'>" + item.name + " uuid #{item.uuid}"+ "</option>"

